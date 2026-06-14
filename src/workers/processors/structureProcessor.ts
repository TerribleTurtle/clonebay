import { logger } from '../../utils/logger';
import type { IEsiService } from '../../services/esi/IEsiService';
import { calculateStructureStatus } from '../../utils/thresholds/structures';

import type { EsiResponse } from '../../services/esi/esiClient';
import type { EsiCorporationStructure } from '../../schemas/esi/corporation';

export async function processStructures(
  charId: string,
  esiService: IEsiService,
  accessToken: string,
  structuresCache: Map<number, Promise<EsiResponse<EsiCorporationStructure[]> | null>>,
  postMessage: (msg: unknown) => void
) {
  try {
    const rolesRes = await esiService.character.getCharacterRoles(charId, accessToken);
    if (!rolesRes || !rolesRes.data) {
      postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: 'Offline', data: [] } });
      return;
    }

    const roles = rolesRes.data;
    const hasRoles = 
      (roles.roles_at_hq && (roles.roles_at_hq.includes('Station_Manager') || roles.roles_at_hq.includes('Director'))) ||
      (roles.roles_at_base && (roles.roles_at_base.includes('Station_Manager') || roles.roles_at_base.includes('Director'))) ||
      (roles.roles_at_other && (roles.roles_at_other.includes('Station_Manager') || roles.roles_at_other.includes('Director')));

    if (!hasRoles) {
      postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: 'Green', data: [] } });
      return;
    }

    const publicInfoRes = await esiService.character.getPublicCharacterInfo(charId);
    if (!publicInfoRes || !publicInfoRes.data || !publicInfoRes.data.corporation_id) {
      postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: 'Offline', data: [] } });
      return;
    }

    const corpId = publicInfoRes.data.corporation_id;

    if (!structuresCache.has(corpId)) {
      structuresCache.set(corpId, esiService.universe.getCorporationStructures(corpId, accessToken));
    }

    const structuresRes = await structuresCache.get(corpId);
    if (!structuresRes || !structuresRes.data) {
      postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: 'Offline', data: [] } });
      return;
    }

    const structures = structuresRes.data;
    
    let worstStatus: 'Green' | 'Yellow' | 'Red' = 'Green';
    for (const struct of structures) {
      const status = calculateStructureStatus(struct, Date.now());
      if (status === 'Red') worstStatus = 'Red';
      else if (status === 'Yellow' && worstStatus !== 'Red') worstStatus = 'Yellow';
    }

    postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: worstStatus, data: structures } });
  } catch (err) {
    logger.error(`ESI Worker: Error processing structures for ${charId}`, err);
    postMessage({ type: 'ESI_DATA_UPDATE', payload: { characterId: charId, dataType: 'structures', status: 'Red', data: null } });
    throw err;
  }
}
