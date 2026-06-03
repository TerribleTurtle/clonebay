import { get } from 'idb-keyval';
import { fetchEsi } from '../utils/esiClient';
import { 
  EsiSkillQueueSchema, 
  EsiIndustryJobSchema,
  EsiCharacterSkillsResponseSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema
} from '../schemas/esi';
import { z } from 'zod';
import { 
  calculateSkillQueueStatus, 
  calculateIndustryStatus, 
  calculatePiStatus,
  PiPinState
} from '../utils/thresholds';
import { fetchSdeType, SdeTypeData } from '../utils/sdeClient';

const POLLING_INTERVAL_SECONDS = 60;
const MS_PER_SECOND = 1000;

const SKILL_ID_MASS_PRODUCTION = 3388;
const SKILL_ID_ADVANCED_MASS_PRODUCTION = 24630;

const PI_GROUP_COMMAND_CENTER = 1043;
const PI_GROUP_SPACEPORT = 1048;
const PI_GROUP_STORAGE_FACILITY = 1064;
const PI_GROUP_EXTRACTOR_CONTROL_UNIT = 1063;

export interface CharacterAuthToken {
  accessToken: string;
  refreshToken: string;
  characterName: string;
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

      const skillsPromise = fetchEsi({
        url: `https://esi.evetech.net/latest/characters/${charId}/skillqueue/`,
        accessToken,
        characterId: charId,
        schema: z.array(EsiSkillQueueSchema)
      }).catch(error => {
        console.error(`ESI Worker: Error fetching skills for ${charId}`, error);
        return null;
      });

      const charSkillsPromise = fetchEsi({
        url: `https://esi.evetech.net/latest/characters/${charId}/skills/`,
        accessToken,
        characterId: charId,
        schema: EsiCharacterSkillsResponseSchema
      }).catch(error => {
        console.error(`ESI Worker: Error fetching character skills for ${charId}`, error);
        return null;
      });

      const industryPromise = fetchEsi({
        url: `https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`,
        accessToken,
        characterId: charId,
        schema: z.array(EsiIndustryJobSchema)
      }).catch(error => {
        console.error(`ESI Worker: Error fetching industry jobs for ${charId}`, error);
        return null;
      });

      const planetsPromise = fetchEsi({
        url: `https://esi.evetech.net/latest/characters/${charId}/planets/`,
        accessToken,
        characterId: charId,
        schema: z.array(EsiPlanetSchema)
      }).catch(error => {
        console.error(`ESI Worker: Error fetching planets for ${charId}`, error);
        return null;
      });

      const [skillsResult, charSkillsResult, industryResult, planetsResult] = await Promise.all([
        skillsPromise,
        charSkillsPromise,
        industryPromise,
        planetsPromise
      ]);

      // 1. Process Skills
      if (skillsResult && skillsResult.data) {
        // Map to strictly omit undefined properties for exactOptionalPropertyTypes
        const status = calculateSkillQueueStatus(skillsResult.data);
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'skills', status, data: skillsResult.data }
        });
      } else if (skillsResult?.status === 'Offline') {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'skills', status: 'Offline', data: null }
        });
      } else {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'skills', status: 'Red', data: null }
        });
      }

      // 2. Process Industry
      if (industryResult && industryResult.data && charSkillsResult && charSkillsResult.data) {
        const skills = charSkillsResult.data.skills;
        const massProd = skills.find(s => s.skill_id === SKILL_ID_MASS_PRODUCTION)?.active_skill_level || 0;
        const advMassProd = skills.find(s => s.skill_id === SKILL_ID_ADVANCED_MASS_PRODUCTION)?.active_skill_level || 0;
        const maxJobs = 1 + massProd + advMassProd;

        const status = calculateIndustryStatus(industryResult.data, maxJobs);
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'industry', status, data: industryResult.data }
        });
      } else if (industryResult?.status === 'Offline') {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'industry', status: 'Offline', data: null }
        });
      } else {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'industry', status: 'Red', data: null }
        });
      }

      // 3. Process PI
      if (planetsResult && planetsResult.data) {
        try {
          const layoutPromises = planetsResult.data.map(p => 
            fetchEsi({
              url: `https://esi.evetech.net/latest/characters/${charId}/planets/${p.planet_id}/`,
              accessToken,
              characterId: charId,
              schema: EsiPlanetLayoutSchema
            })
          );
          
          const layouts = await Promise.all(layoutPromises);
          // Extract unique SDE type IDs to fetch concurrently
          const typeIdsToFetch = new Set<number>();
          for (const layoutRes of layouts) {
            if (!layoutRes.data || !layoutRes.data.pins) continue;
            for (const pin of layoutRes.data.pins) {
              typeIdsToFetch.add(pin.type_id);
              if (pin.contents) {
                for (const item of pin.contents) {
                  typeIdsToFetch.add(item.type_id);
                }
              }
            }
          }

          // Fetch SDE data in parallel to avoid waterfalls
          const sdePromises = Array.from(typeIdsToFetch).map(id => 
            fetchSdeType(id).then(data => ({ id, data }))
          );
          const sdeResults = await Promise.all(sdePromises);
          const sdeMap = new Map<number, SdeTypeData>();
          for (const res of sdeResults) {
            sdeMap.set(res.id, res.data);
          }

          const allPins: PiPinState[] = [];
          for (const layoutRes of layouts) {
            if (!layoutRes.data || !layoutRes.data.pins) continue;
            
            for (const pin of layoutRes.data.pins) {
              const sdeData = sdeMap.get(pin.type_id);
              if (!sdeData) continue;

              const groupId = sdeData.group_id;
              // Storage Groups: Command Centers (1043), Spaceports (1048), Storage Facilities (1064)
              const isStorage = groupId === PI_GROUP_COMMAND_CENTER || groupId === PI_GROUP_SPACEPORT || groupId === PI_GROUP_STORAGE_FACILITY;
              // Extractor Groups: Extractor Control Units (1063)
              const isExtractor = groupId === PI_GROUP_EXTRACTOR_CONTROL_UNIT;
              
              let storageCapacity = undefined;
              let storageUsed = undefined;

              if (isStorage) {
                storageCapacity = sdeData.capacity;
                storageUsed = 0;
                if (pin.contents) {
                  for (const item of pin.contents) {
                    const itemSde = sdeMap.get(item.type_id);
                    const volume = itemSde?.volume || 0;
                    storageUsed += item.amount * volume;
                  }
                }
              }

              const pinState: PiPinState = {
                isExtractor,
                isStorage,
                hasUnroutedMaterials: false
              };

              if (pin.expiry_time !== undefined) {
                pinState.extractorExpiryTime = pin.expiry_time;
              }
              if (storageCapacity !== undefined) {
                pinState.storageCapacity = storageCapacity;
              }
              if (storageUsed !== undefined) {
                pinState.storageUsed = storageUsed;
              }

              allPins.push(pinState);
            }
          }

          const status = calculatePiStatus(allPins);
          self.postMessage({
            type: 'ESI_DATA_UPDATE',
            payload: { characterId: charId, dataType: 'pi', status, data: planetsResult.data }
          });
        } catch (error) {
          console.error(`ESI Worker: Error processing PI layouts for ${charId}`, error);
          self.postMessage({
            type: 'ESI_DATA_UPDATE',
            payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null }
          });
        }
      } else if (planetsResult?.status === 'Offline') {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'pi', status: 'Offline', data: null }
        });
      } else {
        self.postMessage({
          type: 'ESI_DATA_UPDATE',
          payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null }
        });
      }
    }
    
    // Notify main thread that a full polling cycle completed successfully
    self.postMessage({ type: 'POLL_COMPLETE', timestamp: Date.now() });
  } catch (error) {
    console.error("ESI Worker: Error during polling loop:", error);
    throw error;
  }
}
