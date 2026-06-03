import { get } from 'idb-keyval';
import { fetchEsi } from '../utils/esiClient';
import { logger } from '../utils/logger';
import { 
  EsiSkillQueueSchema, 
  EsiIndustryJobSchema,
  EsiCharacterSkillsResponseSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema,
  EsiWalletSchema,
  EsiLocationSchema,
  EsiSkillQueue,
  EsiIndustryJob,
  EsiPlanet,
  EsiCharacterSkillsResponse,
  EsiPlanetLayout,
  EsiWallet,
  EsiLocation
} from '../schemas/esi';
import { z } from 'zod';
import { 
  calculateSkillQueueStatus, 
  calculateIndustryStatus, 
  calculatePiStatus,
  PiPinState
} from '../utils/thresholds';
import { fetchSdeType, fetchSdeSystem, SdeTypeData } from '../utils/sdeClient';
import { mockFleet } from '../utils/mockFleet';

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
      await pollData();
      pollingInterval = self.setInterval(pollData, POLLING_INTERVAL_SECONDS * MS_PER_SECOND); // Poll every minute
    }
  } else if (type === 'STOP_POLLING') {
    if (isPolling && pollingInterval !== null) {
      logger.info("ESI Worker: Polling stopped");
      self.clearInterval(pollingInterval);
      pollingInterval = null;
      isPolling = false;
    }
  }
};

async function pollData() {
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

      let skillsPromise: Promise<import('../utils/esiClient').EsiResponse<EsiSkillQueue[]> | null>;
      let charSkillsPromise: Promise<import('../utils/esiClient').EsiResponse<EsiCharacterSkillsResponse> | null>;
      let industryPromise: Promise<import('../utils/esiClient').EsiResponse<EsiIndustryJob[]> | null>;
      let planetsPromise: Promise<import('../utils/esiClient').EsiResponse<EsiPlanet[]> | null>;
      let walletPromise: Promise<import('../utils/esiClient').EsiResponse<EsiWallet> | null>;
      let locationPromise: Promise<import('../utils/esiClient').EsiResponse<EsiLocation> | null>;

      if (isMockMode) {
        const mockChar = mockFleet.find(c => c.characterId === charId);
        if (mockChar) {
          // Ensure Zod validation still runs on mock data
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
        try {
          const mockChar = isMockMode ? mockFleet.find(c => c.characterId === charId) : null;
          
          let totalSp = charSkillsResult?.data?.total_sp;
          const unallocatedSp = charSkillsResult?.data?.unallocated_sp || 0;
          
          if (totalSp !== undefined && skillsResult?.data) {
            const now = Date.now();
            const activeSkill = skillsResult.data.find(s => {
              if (!s.start_date || !s.finish_date) return false;
              const start = new Date(s.start_date).getTime();
              const finish = new Date(s.finish_date).getTime();
              return now >= start && now <= finish;
            });

            if (activeSkill && activeSkill.start_date && activeSkill.finish_date) {
              const start = new Date(activeSkill.start_date).getTime();
              const finish = new Date(activeSkill.finish_date).getTime();
              const durationMs = finish - start;
              const elapsedMs = now - start;
              if (durationMs > 0 && elapsedMs > 0) {
                const spToTrain = activeSkill.level_end_sp - activeSkill.training_start_sp;
                const spPerMs = spToTrain / durationMs;
                totalSp += Math.floor(elapsedMs * spPerMs);
              }
            }
          }

          const isk = walletResult?.data;
          const locationId = locationResult?.data?.solar_system_id;
          const stationId = locationResult?.data?.station_id;
          const structureId = locationResult?.data?.structure_id;
          
          let locationName = undefined;
          if (locationId) {
            locationName = await fetchSdeSystem(locationId).catch(err => {
              logger.error(`Failed to fetch SDE system name for ${locationId}`, err);
              return undefined;
            });
          }

          self.postMessage({ 
            type: 'ESI_METRICS_UPDATE', 
            payload: { 
              characterId: charId, 
              name: tokenInfo?.characterName || mockChar?.characterName, 
              isk, 
              totalSp, 
              unallocatedSp,
              locationId, 
              locationName,
              stationId,
              structureId
            } 
          });
        // eslint-disable-next-line no-restricted-syntax
        } catch (err) {
          logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
        }
      });

      const skillsProcessing = skillsPromise.then((skillsResult) => {
        if (skillsResult && skillsResult.data) {
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
      });

      const industryProcessing = Promise.all([industryPromise, charSkillsPromise]).then(([industryResult, charSkillsResult]) => {
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
      });

      const piProcessing = planetsPromise.then(async (planetsResult) => {
        if (planetsResult && planetsResult.data) {
          try {
            const layoutPromises = planetsResult.data.map(p => {
              if (isMockMode) {
                const mockChar = mockFleet.find(c => c.characterId === charId);
                if (mockChar && mockChar.planetLayouts[p.planet_id]) {
                  return Promise.resolve<import('../utils/esiClient').EsiResponse<EsiPlanetLayout>>({ data: EsiPlanetLayoutSchema.parse(mockChar.planetLayouts[p.planet_id]), status: 'Green', cached: false });
                }
                return Promise.resolve<import('../utils/esiClient').EsiResponse<EsiPlanetLayout>>({ data: { pins: [] }, status: 'Green', cached: false });
              }
              return fetchEsi({
                url: `https://esi.evetech.net/latest/characters/${charId}/planets/${p.planet_id}/`,
                accessToken,
                characterId: charId,
                schema: EsiPlanetLayoutSchema
              });
            });
            
            const layouts = await Promise.all(layoutPromises);
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
                const isStorage = groupId === PI_GROUP_COMMAND_CENTER || groupId === PI_GROUP_SPACEPORT || groupId === PI_GROUP_STORAGE_FACILITY;
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

                if (pin.expiry_time !== undefined) pinState.extractorExpiryTime = pin.expiry_time;
                if (storageCapacity !== undefined) pinState.storageCapacity = storageCapacity;
                if (storageUsed !== undefined) pinState.storageUsed = storageUsed;

                allPins.push(pinState);
              }
            }

            const status = calculatePiStatus(allPins);
            self.postMessage({
              type: 'ESI_DATA_UPDATE',
              payload: { characterId: charId, dataType: 'pi', status, data: planetsResult.data }
            });
          // eslint-disable-next-line no-restricted-syntax
          } catch (error) {
            logger.error(`ESI Worker: Error processing PI layouts for ${charId}`, error);
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
