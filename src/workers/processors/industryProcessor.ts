import { calculateIndustryStatus } from '../../utils/thresholds';
import type { EsiIndustryJob, EsiCharacterSkillsResponse } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';

const SKILL_ID_MASS_PRODUCTION = 3388;
const SKILL_ID_ADVANCED_MASS_PRODUCTION = 24630;

export function processIndustry(
  charId: string, 
  industryResult: EsiResponse<EsiIndustryJob[]> | null, 
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null,
  postMessage: (msg: unknown) => void
) {
  if (industryResult && industryResult.data && charSkillsResult && charSkillsResult.data) {
    const skills = charSkillsResult.data.skills;
    const massProd = skills.find(s => s.skill_id === SKILL_ID_MASS_PRODUCTION)?.active_skill_level || 0;
    const advMassProd = skills.find(s => s.skill_id === SKILL_ID_ADVANCED_MASS_PRODUCTION)?.active_skill_level || 0;
    const maxJobs = 1 + massProd + advMassProd;

    const status = calculateIndustryStatus(industryResult.data, maxJobs);
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
}
