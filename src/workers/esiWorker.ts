import { get } from 'idb-keyval';
import { logger } from '../utils/logger';
import { mockFleet } from '../utils/mockFleet';
import { processSkills } from './processors/skillsProcessor';
import { processIndustry } from './processors/industryProcessor';
import { processPi } from './processors/piProcessor';
import { processMetrics } from './processors/metricsProcessor';
import { LiveEsiService } from '../services/esi/LiveEsiService';
import { MockEsiService } from '../services/esi/MockEsiService';

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
    const esiService = isMockMode ? new MockEsiService() : new LiveEsiService();
    
    for (const charId of characterIds) {
      const tokenInfo = authTokens ? authTokens[charId] : undefined;
      if (!isMockMode && tokenInfo === undefined) {
          continue;
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

      const metricsProcessing = Promise.all([charSkillsPromise, walletPromise, locationPromise, shipPromise, skillsPromise, clonesPromise, fatiguePromise, transactionsPromise, mailLabelsPromise, contractsPromise, marketOrdersPromise]).then(async ([charSkillsResult, walletResult, locationResult, shipResult, skillsResult, clonesResult, fatigueResult, transactionsResult, mailLabelsResult, contractsResult, marketOrdersResult]) => {
        await processMetrics(charId, tokenInfo?.characterName, charSkillsResult, walletResult, locationResult, shipResult, skillsResult, clonesResult, fatigueResult, transactionsResult, mailLabelsResult, contractsResult, marketOrdersResult, isMockMode, (msg) => self.postMessage(msg));
      });

      const skillsProcessing = skillsPromise.then((skillsResult) => {
        processSkills(charId, skillsResult, (msg) => self.postMessage(msg));
      });

      const industryProcessing = Promise.all([industryPromise, charSkillsPromise]).then(([industryResult, charSkillsResult]) => {
        processIndustry(charId, industryResult, charSkillsResult, (msg) => self.postMessage(msg));
      });

      const piProcessing = planetsPromise.then(async (planetsResult) => {
        await processPi(charId, planetsResult, esiService, accessToken, (msg) => self.postMessage(msg));
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
