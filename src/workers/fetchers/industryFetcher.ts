import { logger } from "../../utils/logger";
import { processIndustry } from "../processors/industryProcessor";
import type { NameCacheService } from "../../services/NameCacheService";
import type { WorkerContext } from "../types";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessIndustry(charId: string, workerContext: WorkerContext, nameCache: NameCacheService, cache: EsiRequestCache) {
  try {
    const getVal = <T>(result: PromiseSettledResult<T>) => result.status === 'fulfilled' ? result.value : null;
    const [industrySettled, charSkillsSettled] = await Promise.allSettled([cache.getIndustryJobs(), cache.getCharacterSkills()]);
    await processIndustry(charId, getVal(industrySettled), getVal(charSkillsSettled), nameCache, (msg) => workerContext.postMessage(msg));
  } catch (err) {
    logger.error(`ESI Worker: Error processing industry for ${charId}`, err);
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "industry", status: "Red", data: null } });
    throw err;
  }
}
