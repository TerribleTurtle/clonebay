import { calculateSkillQueueStatus } from '../../utils/thresholds';
import type { EsiSkillQueue } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';

export function processSkills(
  charId: string, 
  skillsResult: EsiResponse<EsiSkillQueue[]> | null, 
  postMessage: (msg: unknown) => void
) {
  if (skillsResult && skillsResult.data) {
    const status = calculateSkillQueueStatus(skillsResult.data, Date.now());
    postMessage({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: charId, dataType: 'skills', status, data: skillsResult.data }
    });
  } else if (skillsResult?.status === 'Offline') {
    postMessage({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: charId, dataType: 'skills', status: 'Offline', data: null }
    });
  } else {
    postMessage({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: charId, dataType: 'skills', status: 'Red', data: null }
    });
  }
}
