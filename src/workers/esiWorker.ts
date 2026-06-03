import { get } from 'idb-keyval';
import { fetchEsi } from '../utils/esiClient';
import { EsiSkillQueueSchema, EsiIndustryJobSchema } from '../schemas/esi';
import { z } from 'zod';

const POLLING_INTERVAL_SECONDS = 60;
const MS_PER_SECOND = 1000;

export interface CharacterAuthToken {
  accessToken: string;
  refreshToken: string;
  characterName: string;
}

export interface EsiSkillQueueItem {
  skill_id: number;
  finish_date?: string;
  start_date?: string;
  queue_position: number;
}

export interface EsiIndustryJob {
  job_id: number;
  status: string;
  end_date: string;
}

// Global state for polling loop
let isPolling = false;
let pollingInterval: number | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { type } = event.data;

  if (type === 'START_POLLING') {
    if (!isPolling) {
      console.log("ESI Worker: Polling started");
      isPolling = true;
      await pollData();
      pollingInterval = self.setInterval(pollData, POLLING_INTERVAL_SECONDS * MS_PER_SECOND); // Poll every minute
    }
  } else if (type === 'STOP_POLLING') {
    if (isPolling && pollingInterval !== null) {
      console.log("ESI Worker: Polling stopped");
      self.clearInterval(pollingInterval);
      pollingInterval = null;
      isPolling = false;
    }
  }
};

async function pollData() {
  try {
    const authTokens = await get<Record<string, CharacterAuthToken>>('eve_auth_tokens');
    
    if (authTokens === undefined) {
      console.warn("ESI Worker: No auth tokens found in indexedDB.");
      return;
    }

    const characterIds = Object.keys(authTokens);
    
    for (const charId of characterIds) {
      const tokenInfo = authTokens[charId];
      if (tokenInfo === undefined) {
          continue;
      }
      const { accessToken } = tokenInfo;

      // 1. Fetch Skill Queue
      try {
        const skillUrl = `https://esi.evetech.net/latest/characters/${charId}/skillqueue/`;
        const result = await fetchEsi({
          url: skillUrl,
          accessToken,
          characterId: charId,
          schema: z.array(EsiSkillQueueSchema)
        });
        
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: {
            characterId: charId,
            dataType: 'skills',
            status: result.status,
            data: result.data
          }
        });
      } catch (error) {
        console.error(`ESI Worker: Error fetching skills for ${charId}`, error);
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: {
            characterId: charId,
            dataType: 'skills',
            status: 'Red',
            data: null
          }
        });
      }
      
      // 2. Fetch Industry Jobs
      try {
        const industryUrl = `https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`;
        const result = await fetchEsi({
          url: industryUrl,
          accessToken,
          characterId: charId,
          schema: z.array(EsiIndustryJobSchema)
        });
        
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: {
            characterId: charId,
            dataType: 'industry',
            status: result.status,
            data: result.data
          }
        });
      } catch (error) {
        console.error(`ESI Worker: Error fetching industry jobs for ${charId}`, error);
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: {
            characterId: charId,
            dataType: 'industry',
            status: 'Red',
            data: null
          }
        });
      }
    }
  } catch (error) {
    console.error("ESI Worker: Error during polling loop:", error);
    throw error;
  }
}
