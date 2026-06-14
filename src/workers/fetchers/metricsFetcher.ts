import { logger } from "../../utils/logger";
import { processMetrics } from "../processors/metricsProcessor";
import type { IEsiService } from "../../services/esi/IEsiService";
import type { WorkerContext } from "../types";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessMetrics(charId: string, charName: string | undefined, isMockMode: boolean, workerContext: WorkerContext, esiService: IEsiService, accessToken: string, cache: EsiRequestCache) {
  try {
    const getVal = <T>(result: PromiseSettledResult<T>) => result.status === 'fulfilled' ? result.value : null;

    const [
      charSkillsSettled, walletSettled, locationSettled, shipSettled, skillsSettled,
      clonesSettled, fatigueSettled, transactionsSettled, mailLabelsSettled, contractsSettled, marketOrdersSettled
    ] = await Promise.allSettled([
      cache.getCharacterSkills(), cache.getWallet(), cache.getLocation(), cache.getShip(), cache.getSkillQueue(),
      cache.getClones(), cache.getFatigue(), cache.getTransactions(), cache.getMailLabels(), cache.getContracts(), cache.getMarketOrders()
    ]);

    await processMetrics({
      charId, charName, 
      charSkillsResult: getVal(charSkillsSettled), 
      walletResult: getVal(walletSettled), 
      locationResult: getVal(locationSettled), 
      shipResult: getVal(shipSettled), 
      skillsResult: getVal(skillsSettled),
      clonesResult: getVal(clonesSettled), 
      fatigueResult: getVal(fatigueSettled), 
      transactionsResult: getVal(transactionsSettled), 
      mailLabelsResult: getVal(mailLabelsSettled), 
      contractsResult: getVal(contractsSettled), 
      marketOrdersResult: getVal(marketOrdersSettled),
      isMockMode, postMessage: (msg) => workerContext.postMessage(msg), esiService, accessToken,
    });
  } catch (err) {
    logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
    workerContext.postMessage({ type: "ESI_METRICS_UPDATE", payload: { characterId: charId, walletStatus: "Red", locationStatus: "Red", mailStatus: "Red", cloneStatus: "Red" } });
    throw err;
  }
}
