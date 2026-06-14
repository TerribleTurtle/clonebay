import { logger } from "../../utils/logger";
import { processSkills } from "../processors/skillsProcessor";
import type { NameCacheService } from "../../services/NameCacheService";
import type { WorkerContext } from "../types";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessSkills(charId: string, workerContext: WorkerContext, nameCache: NameCacheService, cache: EsiRequestCache) {
  try {
    const skillsResult = await cache.getSkillQueue();
    await processSkills(charId, skillsResult, nameCache, (msg) => workerContext.postMessage(msg));
  } catch (err) {
    logger.error(`ESI Worker: Error processing skills for ${charId}`, err);
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "skills", status: "Red", data: null } });
    throw err;
  }
}
