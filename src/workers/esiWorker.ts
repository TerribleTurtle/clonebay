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
  EsiLocation,
  EsiShip,
  EsiClones,
  EsiFatigue,
  EsiClonesSchema,
  EsiFatigueSchema,
  EsiTransaction,
  EsiTransactionSchema,
  EsiShipSchema,
  EsiMailLabels,
  EsiContract,
  EsiMailLabelsSchema,
  EsiContractSchema
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
      let shipPromise: Promise<EsiResponse<EsiShip> | null>;
      let clonesPromise: Promise<EsiResponse<EsiClones> | null>;
      let fatiguePromise: Promise<EsiResponse<EsiFatigue> | null>;
      let transactionsPromise: Promise<EsiResponse<EsiTransaction[]> | null>;
      let mailLabelsPromise: Promise<EsiResponse<EsiMailLabels> | null>;
      let contractsPromise: Promise<EsiResponse<EsiContract[]> | null>;

      const safeFetch = <T>(url: string, schema: z.ZodType<T>, name: string): Promise<EsiResponse<T> | null> => 
        fetchEsi({ url, accessToken, characterId: charId, schema }).catch(error => {
          logger.error(`ESI Worker: Error fetching ${name} for ${charId}`, error);
          return null;
        });

      if (isMockMode) {
        const mockChar = mockFleet.find(c => c.characterId === charId);
        if (mockChar) {
          skillsPromise = Promise.resolve({ data: z.array(EsiSkillQueueSchema).parse(mockChar.skills), status: 'Green', cached: false });
          charSkillsPromise = Promise.resolve({ data: EsiCharacterSkillsResponseSchema.parse(mockChar.charSkills), status: 'Green', cached: false });
          industryPromise = Promise.resolve({ data: z.array(EsiIndustryJobSchema).parse(mockChar.industry), status: 'Green', cached: false });
          planetsPromise = Promise.resolve({ data: z.array(EsiPlanetSchema).parse(mockChar.planets), status: 'Green', cached: false });
          walletPromise = Promise.resolve({ data: EsiWalletSchema.parse(mockChar.isk), status: 'Green', cached: false });
          locationPromise = Promise.resolve({ data: EsiLocationSchema.parse(mockChar.location), status: 'Green', cached: false });
          shipPromise = Promise.resolve({ data: EsiShipSchema.parse(mockChar.ship), status: 'Green', cached: false });
          clonesPromise = Promise.resolve({ data: EsiClonesSchema.parse(mockChar.clones), status: 'Green', cached: false });
          fatiguePromise = Promise.resolve({ data: EsiFatigueSchema.parse(mockChar.fatigue), status: 'Green', cached: false });
          transactionsPromise = Promise.resolve({ data: z.array(EsiTransactionSchema).parse(mockChar.transactions), status: 'Green', cached: false });
          mailLabelsPromise = Promise.resolve({ data: EsiMailLabelsSchema.parse(mockChar.mail), status: 'Green', cached: false });
          contractsPromise = Promise.resolve({ data: z.array(EsiContractSchema).parse(mockChar.contracts), status: 'Green', cached: false });
        } else {
          skillsPromise = Promise.resolve(null);
          charSkillsPromise = Promise.resolve(null);
          industryPromise = Promise.resolve(null);
          planetsPromise = Promise.resolve(null);
          walletPromise = Promise.resolve(null);
          locationPromise = Promise.resolve(null);
          shipPromise = Promise.resolve(null);
          clonesPromise = Promise.resolve(null);
          fatiguePromise = Promise.resolve(null);
          transactionsPromise = Promise.resolve(null);
          mailLabelsPromise = Promise.resolve(null);
          contractsPromise = Promise.resolve(null);
        }
      } else {
        skillsPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skillqueue/`, z.array(EsiSkillQueueSchema), 'skills');
        charSkillsPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skills/`, EsiCharacterSkillsResponseSchema, 'character skills');
        industryPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`, z.array(EsiIndustryJobSchema), 'industry jobs');
        planetsPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/`, z.array(EsiPlanetSchema), 'planets');
        walletPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/`, EsiWalletSchema, 'wallet');
        locationPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, EsiLocationSchema, 'location');
        shipPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, EsiShipSchema, 'ship');
        clonesPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/clones/`, EsiClonesSchema, 'clones');
        fatiguePromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/fatigue/`, EsiFatigueSchema, 'fatigue');
        transactionsPromise = safeFetch(`https://esi.evetech.net/v1/characters/${charId}/wallet/transactions/`, z.array(EsiTransactionSchema), 'transactions');
        mailLabelsPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/labels/`, EsiMailLabelsSchema, 'mail labels');
        contractsPromise = safeFetch(`https://esi.evetech.net/latest/characters/${charId}/contracts/`, z.array(EsiContractSchema), 'contracts');
      }

      const metricsProcessing = Promise.all([charSkillsPromise, walletPromise, locationPromise, shipPromise, skillsPromise, clonesPromise, fatiguePromise, transactionsPromise, mailLabelsPromise, contractsPromise]).then(async ([charSkillsResult, walletResult, locationResult, shipResult, skillsResult, clonesResult, fatigueResult, transactionsResult, mailLabelsResult, contractsResult]) => {
        await processMetrics(charId, tokenInfo?.characterName, charSkillsResult, walletResult, locationResult, shipResult, skillsResult, clonesResult, fatigueResult, transactionsResult, mailLabelsResult, contractsResult, isMockMode, (msg) => self.postMessage(msg));
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
