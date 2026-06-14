import { logger } from "../../utils/logger";
import { processPi } from "../processors/piProcessor";
import type { IEsiService } from "../../services/esi/IEsiService";
import type { NameCacheService } from "../../services/NameCacheService";
import type { WorkerContext } from "../types";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessPi(charId: string, workerContext: WorkerContext, esiService: IEsiService, accessToken: string, nameCache: NameCacheService, cache: EsiRequestCache) {
  try {
    const planetsResult = await cache.getPlanets();
    await processPi(charId, planetsResult, esiService, accessToken, nameCache, (msg) => workerContext.postMessage(msg));
  } catch (err) {
    logger.error(`ESI Worker: Error processing PI for ${charId}`, err);
    workerContext.postMessage({ type: "ESI_DATA_UPDATE", payload: { characterId: charId, dataType: "pi", status: "Red", data: null } });
    throw err;
  }
}
