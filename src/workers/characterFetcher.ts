import { logger } from "../utils/logger";
import { processStructures } from "./processors/structureProcessor";
import { fetchAndProcessMetrics } from "./fetchers/metricsFetcher";
import { fetchAndProcessSkills } from "./fetchers/skillsFetcher";
import { fetchAndProcessIndustry } from "./fetchers/industryFetcher";
import { fetchAndProcessPi } from "./fetchers/piFetcher";
import { fetchAndProcessNotifications } from "./fetchers/notificationsFetcher";
import { fetchAndProcessWalletJournal } from "./fetchers/journalFetcher";
import { EsiRequestCache } from "./fetchers/EsiRequestCache";
import type { IEsiService } from "../services/esi/IEsiService";
import type { NameCacheService } from "../services/NameCacheService";
import type { EsiResponse } from "../services/esi/esiClient";
import type { EsiCorporationStructure } from "../schemas/esi/corporation";
import type { WorkerContext, CharacterAuthToken } from "./types";

export async function fetchCharacterData(
  charId: string,
  tokenInfo: CharacterAuthToken | undefined,
  isMockMode: boolean,
  workerContext: WorkerContext,
  esiService: IEsiService,
  nameCache: NameCacheService,
  structuresCache: Map<number, Promise<EsiResponse<EsiCorporationStructure[]> | null>>
): Promise<void> {
  try {
    if (!isMockMode && tokenInfo === undefined) return;
    const accessToken = tokenInfo?.accessToken || "mock_token";

    const cache = new EsiRequestCache(esiService, charId, accessToken);

    await Promise.allSettled([
      fetchAndProcessMetrics(charId, tokenInfo?.characterName, isMockMode, workerContext, esiService, accessToken, cache),
      fetchAndProcessSkills(charId, workerContext, nameCache, cache),
      fetchAndProcessIndustry(charId, workerContext, nameCache, cache),
      fetchAndProcessPi(charId, workerContext, esiService, accessToken, nameCache, cache),
      fetchAndProcessNotifications(charId, workerContext, esiService, cache),
      fetchAndProcessWalletJournal(charId, cache),
      processStructures(charId, esiService, accessToken, structuresCache, (msg) => workerContext.postMessage(msg))
    ]);

  } catch (err) {
    logger.error(`ESI Worker: Critical error in character loop for ${charId}:`, err);
    throw err;
  }
}
