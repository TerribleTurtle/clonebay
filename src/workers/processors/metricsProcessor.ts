import { fetchSdeSystem } from '../../utils/sdeClient';
import { logger } from '../../utils/logger';
import { mockFleet } from '../../utils/mockFleet';
import type { EsiSkillQueue, EsiCharacterSkillsResponse, EsiWallet, EsiLocation } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';

export async function processMetrics(
  charId: string,
  charName: string | undefined,
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null | undefined,
  walletResult: EsiResponse<EsiWallet> | null | undefined,
  locationResult: EsiResponse<EsiLocation> | null | undefined,
  skillsResult: EsiResponse<EsiSkillQueue[]> | null | undefined,
  isMockMode: boolean,
  postMessage: (msg: unknown) => void
) {
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

    postMessage({ 
      type: 'ESI_METRICS_UPDATE', 
      payload: { 
        characterId: charId, 
        name: charName || mockChar?.characterName, 
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
}
