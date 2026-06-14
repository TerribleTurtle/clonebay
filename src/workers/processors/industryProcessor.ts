import { calculateIndustryStatus } from '../../utils/thresholds';
import type { EsiIndustryJob, EsiCharacterSkillsResponse } from '../../schemas/esi';
import type { EsiResponse } from '../../services/esi/esiClient';
import { logger } from '../../utils/logger';

const SKILL_ID_MASS_PRODUCTION = 3388;
const SKILL_ID_ADVANCED_MASS_PRODUCTION = 24630;

export async function processIndustry(
  charId: string, 
  industryResult: EsiResponse<EsiIndustryJob[]> | null, 
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null,
  nameCache: import('../../services/NameCacheService').NameCacheService,
  postMessage: (msg: unknown) => void
) {
  try {
    if (industryResult && industryResult.data && charSkillsResult && charSkillsResult.data) {
      const skills = charSkillsResult.data.skills;
      const { massProd, advMassProd } = skills.reduce((acc, s) => {
        if (s.skill_id === SKILL_ID_MASS_PRODUCTION) acc.massProd = s.active_skill_level;
        if (s.skill_id === SKILL_ID_ADVANCED_MASS_PRODUCTION) acc.advMassProd = s.active_skill_level;
        return acc;
      }, { massProd: 0, advMassProd: 0 });
      const maxJobs = 1 + massProd + advMassProd;

      const manufacturingJobs = industryResult.data.filter(job => job.activity_id === 1);
      const { status, alerts } = calculateIndustryStatus(manufacturingJobs, maxJobs, Date.now());
      
      const indyContext: { alerts: string[] } = { alerts: [] };
      if (alerts && alerts.length > 0) {
        // Extract IDs for resolution
        const typeIds = alerts.map(a => a.blueprintId).filter(id => id > 0);
        const locationIds = alerts.flatMap(a => [a.facilityId, a.stationId]).filter((id): id is number => id !== undefined && id > 0);
        const uniqueIds = Array.from(new Set([...typeIds, ...locationIds]));
        const resolvedNames = await nameCache.resolveIdsToNames(uniqueIds);
        
        indyContext.alerts = alerts.map(a => {
          if (a.blueprintId === 0) return a.message; // Empty Slot usually has no blueprint
          
          const bpName = resolvedNames[a.blueprintId] || `Blueprint ${a.blueprintId}`;
          const locationId = a.facilityId || a.stationId;
          const locName = locationId ? (resolvedNames[locationId] || `Location ${locationId}`) : '';
          
          if (locName) {
            return `${locName} - ${bpName}: ${a.message}`;
          }
          return `${bpName}: ${a.message}`;
        });
      } else {
        indyContext.alerts.push(`${manufacturingJobs.length} / ${maxJobs} Manufacturing Jobs Active`);
      }

      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'industry', status, data: industryResult.data, indyContext }
      });
    } else if (industryResult?.status === 'Offline') {
      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'industry', status: 'Offline', data: null }
      });
    } else {
      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'industry', status: 'Red', data: null }
      });
    }
   
  } catch (error) {
    logger.error(`ESI Worker: Error calculating industry status for ${charId}`, error);
    postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'industry', status: 'Red', data: null } });
    throw error;
  }
}
