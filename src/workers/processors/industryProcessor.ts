import { calculateIndustryStatus } from '../../utils/thresholds';
import type { EsiIndustryJob, EsiCharacterSkillsResponse } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';
import { logger } from '../../utils/logger';

const SKILL_ID_MASS_PRODUCTION = 3388;
const SKILL_ID_ADVANCED_MASS_PRODUCTION = 24630;

export function processIndustry(
  charId: string, 
  industryResult: EsiResponse<EsiIndustryJob[]> | null, 
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null,
  postMessage: (msg: unknown) => void
) {
  try {
    if (industryResult && industryResult.data && charSkillsResult && charSkillsResult.data) {
      const skills = charSkillsResult.data.skills;
      const massProd = skills.find(s => s.skill_id === SKILL_ID_MASS_PRODUCTION)?.active_skill_level || 0;
      const advMassProd = skills.find(s => s.skill_id === SKILL_ID_ADVANCED_MASS_PRODUCTION)?.active_skill_level || 0;
      const maxJobs = 1 + massProd + advMassProd;

      const manufacturingJobs = industryResult.data.filter(job => job.activity_id === 1);
      const status = calculateIndustryStatus(manufacturingJobs, maxJobs, Date.now());
      
      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'industry', status, data: industryResult.data }
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
  }
}
