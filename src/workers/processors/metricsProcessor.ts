import { fetchSdeSystem } from '../../utils/sdeClient';
import { logger } from '../../utils/logger';
import { mockFleet } from '../../utils/mockFleet';
import type { EsiSkillQueue, EsiCharacterSkillsResponse, EsiWallet, EsiLocation, EsiShip, EsiClones, EsiFatigue, EsiTransaction, EsiMailLabels, EsiContract, EsiMarketOrder } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';
import { calculateWalletStatus, calculateMailStatus, calculateCloneStatus, calculateLocationStatus } from '../../utils/thresholds';

export async function processMetrics(
  charId: string,
  charName: string | undefined,
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null | undefined,
  walletResult: EsiResponse<EsiWallet> | null | undefined,
  locationResult: EsiResponse<EsiLocation> | null | undefined,
  shipResult: EsiResponse<EsiShip> | null | undefined,
  skillsResult: EsiResponse<EsiSkillQueue[]> | null | undefined,
  clonesResult: EsiResponse<EsiClones> | null | undefined,
  fatigueResult: EsiResponse<EsiFatigue> | null | undefined,
  transactionsResult: EsiResponse<EsiTransaction[]> | null | undefined,
  mailLabelsResult: EsiResponse<EsiMailLabels> | null | undefined,
  contractsResult: EsiResponse<EsiContract[]> | null | undefined,
  marketOrdersResult: EsiResponse<EsiMarketOrder[]> | null | undefined,
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
    const location = locationResult?.data;
    const ship = shipResult?.data;
    
    let locationName = undefined;
    if (locationId) {
      locationName = await fetchSdeSystem(locationId).catch(err => {
        logger.error(`Failed to fetch SDE system name for ${locationId}`, err);
        return undefined;
      });
    }

    const clones = clonesResult?.data;
    const fatigue = fatigueResult?.data;
    const transactions = transactionsResult?.data;
    const mail = mailLabelsResult?.data;
    const contracts = contractsResult?.data;
    const marketOrders = marketOrdersResult?.data;

    const now = Date.now();
    const walletStatus = calculateWalletStatus(isk);
    const locationStatus = calculateLocationStatus(stationId, structureId);
    const mailStatus = calculateMailStatus(mail?.total_unread_count);
    const cloneStatus = calculateCloneStatus(clones?.last_clone_jump_date, now);

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
        structureId,
        location,
        ship,
        clones,
        fatigue,
        transactions,
        mail,
        contracts,
        marketOrders,
        walletStatus,
        locationStatus,
        mailStatus,
        cloneStatus
      } 
    });
  // eslint-disable-next-line no-restricted-syntax
  } catch (err) {
    logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
    postMessage({
      type: 'ESI_METRICS_UPDATE',
      payload: {
        characterId: charId,
        walletStatus: 'Red',
        locationStatus: 'Red',
        mailStatus: 'Red',
        cloneStatus: 'Red'
      }
    });
  }
}
