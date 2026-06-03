import { get } from 'idb-keyval';
import { fetchEsi, type EsiResponse } from '../utils/esiClient';
import { logger } from '../utils/logger';
import { 
  EsiSkillQueueSchema, 
  EsiIndustryJobSchema,
  EsiCharacterSkillsResponseSchema,
  EsiPlanetSchema,
  EsiWalletSchema,
  EsiLocationSchema,
  EsiSkillQueue,
  EsiIndustryJob,
  EsiPlanet,
  EsiCharacterSkillsResponse,
  EsiWallet,
  EsiLocation
} from '../schemas/esi';
import { z } from 'zod';
import { mockFleet } from '../utils/mockFleet';
import { processSkills } from './processors/skillsProcessor';
import { processIndustry } from './processors/industryProcessor';
import { processPi } from './processors/piProcessor';
import { processMetrics } from './processors/metricsProcessor';

const POLLING_INTERVAL_SECONDS = 60;
const MS_PER_SECOND = 1000;

export interface CharacterAuthToken {
  accessToken: string;
  refreshToken: string;
  characterName: string;
}

// Global state for polling loop
let isPolling = false;
let pollingTimeout: number | null = null;
let activeMockMode = false;

self.onmessage = async (event: MessageEvent) => {
  const { type, isMockMode } = event.data;

  if (type === 'PING') {
    self.postMessage({ type: 'PONG' });
  } else if (type === 'START_POLLING') {
    if (!isPolling) {
      logger.info("ESI Worker: Polling started");
      activeMockMode = isMockMode || false;
      isPolling = true;
      pollLoop();
    }
  } else if (type === 'STOP_POLLING') {
    if (isPolling) {
      logger.info("ESI Worker: Polling stopped");
      if (pollingTimeout !== null) {
        self.clearTimeout(pollingTimeout);
        pollingTimeout = null;
      }
      isPolling = false;
    }
  }
};

async function pollLoop() {
  if (!isPolling) return;
  try {
    await pollData();
  } catch (error) {
    console.error("ESI Worker: Unhandled error in pollData cycle:", error);
  }
  if (isPolling) {
    pollingTimeout = self.setTimeout(pollLoop, POLLING_INTERVAL_SECONDS * MS_PER_SECOND);
  }
}

async function pollData(): Promise<void> {
  try {
    const isMockMode = activeMockMode;
    const authTokens = await get<Record<string, CharacterAuthToken>>('eve_auth_tokens');
    
    if (authTokens === undefined && !isMockMode) {
      logger.warn("ESI Worker: No auth tokens found in indexedDB.");
      return;
    }

    const characterIds = isMockMode ? mockFleet.map(c => c.characterId) : Object.keys(authTokens || {});
    
    for (const charId of characterIds) {
      const tokenInfo = authTokens ? authTokens[charId] : undefined;
      if (!isMockMode && tokenInfo === undefined) {
          continue;
      }
      const accessToken = tokenInfo?.accessToken || 'mock_token';

      let skillsPromise: Promise<EsiResponse<EsiSkillQueue[]> | null>;
      let charSkillsPromise: Promise<EsiResponse<EsiCharacterSkillsResponse> | null>;
      let industryPromise: Promise<EsiResponse<EsiIndustryJob[]> | null>;
      let planetsPromise: Promise<EsiResponse<EsiPlanet[]> | null>;
      let walletPromise: Promise<EsiResponse<EsiWallet> | null>;
      let locationPromise: Promise<EsiResponse<EsiLocation> | null>;

      if (isMockMode) {
        const mockChar = mockFleet.find(c => c.characterId === charId);
        if (mockChar) {
          skillsPromise = Promise.resolve({ data: z.array(EsiSkillQueueSchema).parse(mockChar.skills), status: 'Green', cached: false });
          charSkillsPromise = Promise.resolve({ data: EsiCharacterSkillsResponseSchema.parse(mockChar.charSkills), status: 'Green', cached: false });
          industryPromise = Promise.resolve({ data: z.array(EsiIndustryJobSchema).parse(mockChar.industry), status: 'Green', cached: false });
          planetsPromise = Promise.resolve({ data: z.array(EsiPlanetSchema).parse(mockChar.planets), status: 'Green', cached: false });
          walletPromise = Promise.resolve({ data: EsiWalletSchema.parse(mockChar.isk), status: 'Green', cached: false });
          locationPromise = Promise.resolve({ data: EsiLocationSchema.parse(mockChar.location), status: 'Green', cached: false });
        } else {
          skillsPromise = Promise.resolve(null);
          charSkillsPromise = Promise.resolve(null);
          industryPromise = Promise.resolve(null);
          planetsPromise = Promise.resolve(null);
          walletPromise = Promise.resolve(null);
          locationPromise = Promise.resolve(null);
        }
      } else {
        skillsPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/skillqueue/`,
          accessToken,
          characterId: charId,
          schema: z.array(EsiSkillQueueSchema)
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching skills for ${charId}`, error);
          return null;
        });

        charSkillsPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/skills/`,
          accessToken,
          characterId: charId,
          schema: EsiCharacterSkillsResponseSchema
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching character skills for ${charId}`, error);
          return null;
        });

        industryPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`,
          accessToken,
          characterId: charId,
          schema: z.array(EsiIndustryJobSchema)
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching industry jobs for ${charId}`, error);
          return null;
        });

        planetsPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/planets/`,
          accessToken,
          characterId: charId,
          schema: z.array(EsiPlanetSchema)
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching planets for ${charId}`, error);
          return null;
        });

        walletPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/wallet/`,
          accessToken,
          characterId: charId,
          schema: EsiWalletSchema
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching wallet for ${charId}`, error);
          return null;
        });

        locationPromise = fetchEsi({
          url: `https://esi.evetech.net/latest/characters/${charId}/location/`,
          accessToken,
          characterId: charId,
          schema: EsiLocationSchema
        }).catch(error => {
          logger.error(`ESI Worker: Error fetching location for ${charId}`, error);
          return null;
        });
      }

      const metricsProcessing = Promise.all([charSkillsPromise, walletPromise, locationPromise, skillsPromise]).then(async ([charSkillsResult, walletResult, locationResult, skillsResult]) => {
        await processMetrics(charId, tokenInfo?.characterName, charSkillsResult, walletResult, locationResult, skillsResult, isMockMode, (msg) => self.postMessage(msg));
      });

      const skillsProcessing = skillsPromise.then((skillsResult) => {
        processSkills(charId, skillsResult, (msg) => self.postMessage(msg));
      });

      const industryProcessing = Promise.all([industryPromise, charSkillsPromise]).then(([industryResult, charSkillsResult]) => {
        processIndustry(charId, industryResult, charSkillsResult, (msg) => self.postMessage(msg));
      });

      const piProcessing = planetsPromise.then(async (planetsResult) => {
        await processPi(charId, planetsResult, isMockMode, accessToken, (msg) => self.postMessage(msg));
      });

      await Promise.all([metricsProcessing, skillsProcessing, industryProcessing, piProcessing]);
    }
    
    // Notify main thread that a full polling cycle completed successfully
    self.postMessage({ type: 'POLL_COMPLETE', timestamp: Date.now() });
  } catch (error) {
    logger.error("ESI Worker: Error during polling loop:", error);
    throw error;
  }
}
