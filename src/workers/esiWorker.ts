import { get } from 'idb-keyval';
import { logger } from '../utils/logger';
import { mockFleet } from '../utils/mockFleet';
import { processSkills } from './processors/skillsProcessor';
import { processIndustry } from './processors/industryProcessor';
import { processPi } from './processors/piProcessor';
import { processMetrics } from './processors/metricsProcessor';
import { LiveEsiService } from '../services/esi/LiveEsiService';
import { MockEsiService } from '../services/esi/MockEsiService';
import type { IEsiService } from '../services/esi/IEsiService';

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
  const esiService: IEsiService = activeMockMode ? new MockEsiService() : new LiveEsiService();
  
  await pollData(esiService);
  
  if (isPolling) {
    pollingTimeout = self.setTimeout(pollLoop, POLLING_INTERVAL_SECONDS * MS_PER_SECOND);
  }
}

async function pollData(esiService: IEsiService): Promise<void> {
  const isMockMode = activeMockMode;
  let authTokens;
  try {
    authTokens = await get('eve_auth_tokens');
   
  } catch (err) {
    logger.error("ESI Worker: Failed to get auth tokens", err);
    return;
  }
  
  if (authTokens === undefined && !isMockMode) {
    logger.warn("ESI Worker: No auth tokens found in indexedDB.");
    return;
  }

  const characterIds = isMockMode ? mockFleet.map(c => c.characterId) : Object.keys(authTokens || {});
  
  const characterPromises = characterIds.map(async (charId) => {
    try {
      const tokenInfo = authTokens ? authTokens[charId] : undefined;
      if (!isMockMode && tokenInfo === undefined) {
          return;
      }
      const accessToken = tokenInfo?.accessToken || 'mock_token';

      const skillsPromise = esiService.getSkillQueue(charId, accessToken);
      const charSkillsPromise = esiService.getCharacterSkills(charId, accessToken);
      const industryPromise = esiService.getIndustryJobs(charId, accessToken);
      const planetsPromise = esiService.getPlanets(charId, accessToken);
      const walletPromise = esiService.getWallet(charId, accessToken);
      const locationPromise = esiService.getLocation(charId, accessToken);
      const shipPromise = esiService.getShip(charId, accessToken);
      const clonesPromise = esiService.getClones(charId, accessToken);
      const fatiguePromise = esiService.getFatigue(charId, accessToken);
      const transactionsPromise = esiService.getTransactions(charId, accessToken);
      const mailLabelsPromise = esiService.getMailLabels(charId, accessToken);
      const contractsPromise = esiService.getContracts(charId, accessToken);
      const marketOrdersPromise = esiService.getMarketOrders(charId, accessToken);

      // Architectural Reasoning: We group these 11 ESI calls into a single Promise.all block
      // to ensure an atomic state update for the core UI metrics. Rather than dispatching 11
      // separate 'ESI_METRICS_UPDATE' events (which would cause rapid UI thrashing/re-rendering),
      // we await all necessary data and process it together. This minimizes state fragmentation,
      // guarantees a coherent snapshot of the character's status, and reduces React re-renders.
      const metricsProcessing = Promise.all([
        charSkillsPromise, walletPromise, locationPromise, shipPromise, skillsPromise, clonesPromise, fatiguePromise, transactionsPromise, mailLabelsPromise, contractsPromise, marketOrdersPromise
      ]).then(async ([
        charSkillsResult, walletResult, locationResult, shipResult, skillsResult, clonesResult, fatigueResult, transactionsResult, mailLabelsResult, contractsResult, marketOrdersResult
      ]) => {
        await processMetrics({
          charId,
          charName: tokenInfo?.characterName,
          charSkillsResult,
          walletResult,
          locationResult,
          shipResult,
          skillsResult,
          clonesResult,
          fatigueResult,
          transactionsResult,
          mailLabelsResult,
          contractsResult,
          marketOrdersResult,
          isMockMode,
          postMessage: (msg) => self.postMessage(msg)
        });
      }).catch(err => {
        logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
        self.postMessage({ type: 'ESI_METRICS_UPDATE', payload: { characterId: charId, walletStatus: 'Red', locationStatus: 'Red', mailStatus: 'Red', cloneStatus: 'Red' } });
      });

      const skillsProcessing = skillsPromise.then((skillsResult) => {
        processSkills(charId, skillsResult, (msg) => self.postMessage(msg));
      }).catch(err => {
        logger.error(`ESI Worker: Error processing skills for ${charId}`, err);
        self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'skills', status: 'Red', data: null } });
      });

      const industryProcessing = Promise.all([industryPromise, charSkillsPromise]).then(([industryResult, charSkillsResult]) => {
        processIndustry(charId, industryResult, charSkillsResult, (msg) => self.postMessage(msg));
      }).catch(err => {
        logger.error(`ESI Worker: Error processing industry for ${charId}`, err);
        self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'industry', status: 'Red', data: null } });
      });

      const piProcessing = planetsPromise.then(async (planetsResult) => {
        await processPi(charId, planetsResult, esiService, accessToken, (msg) => self.postMessage(msg));
      }).catch(err => {
        logger.error(`ESI Worker: Error processing PI for ${charId}`, err);
        self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null } });
      });

      await Promise.all([metricsProcessing, skillsProcessing, industryProcessing, piProcessing]);
     
    } catch (err) {
      logger.error(`ESI Worker: Error in character loop for ${charId}:`, err);
      self.postMessage({ type: 'ESI_METRICS_UPDATE', payload: { characterId: charId, walletStatus: 'Red', locationStatus: 'Red', mailStatus: 'Red', cloneStatus: 'Red' } });
      self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'skills', status: 'Red', data: null } });
      self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'industry', status: 'Red', data: null } });
      self.postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null } });
    }
  });

  await Promise.allSettled(characterPromises);
  
  self.postMessage({ type: 'POLL_COMPLETE', timestamp: Date.now() });
}