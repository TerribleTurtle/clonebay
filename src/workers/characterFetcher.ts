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

interface WorkerMsg {
  type?: string;
  payload?: Record<string, unknown>;
}

function isWorkerMsg(msg: unknown): msg is WorkerMsg {
  return typeof msg === 'object' && msg !== null;
}

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

    const batchedPayload: Record<string, unknown> = { characterId: charId };

    const interceptorContext: WorkerContext = {
      ...workerContext,
      postMessage: (msg: unknown) => {
        if (isWorkerMsg(msg)) {
          if (msg.type === 'ESI_DATA_UPDATE' && msg.payload) {
            const { dataType, status, skillsContext, piContext, indyContext, warContext, maxClones } = msg.payload;
            const stateKey = dataType === 'war' ? 'warStatus' : String(dataType);
            batchedPayload[stateKey] = status;
            if (skillsContext) batchedPayload['skillsContext'] = skillsContext;
            if (piContext) batchedPayload['piContext'] = piContext;
            if (indyContext) batchedPayload['indyContext'] = indyContext;
            if (warContext) batchedPayload['warContext'] = warContext;
            if (maxClones !== undefined) batchedPayload['maxClones'] = maxClones;
          } else if (msg.type === 'ESI_METRICS_UPDATE' && msg.payload) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { characterId, ...metrics } = msg.payload;
            Object.assign(batchedPayload, metrics);
          } else {
            workerContext.postMessage(msg);
          }
        } else {
          workerContext.postMessage(msg);
        }
      }
    };

    await Promise.allSettled([
      fetchAndProcessMetrics(charId, tokenInfo?.characterName, isMockMode, interceptorContext, esiService, accessToken, cache),
      fetchAndProcessSkills(charId, interceptorContext, nameCache, cache),
      fetchAndProcessIndustry(charId, interceptorContext, nameCache, cache),
      fetchAndProcessPi(charId, interceptorContext, esiService, accessToken, nameCache, cache),
      fetchAndProcessNotifications(charId, interceptorContext, esiService, cache),
      fetchAndProcessWalletJournal(charId, cache),
      processStructures(charId, esiService, accessToken, structuresCache, (msg) => interceptorContext.postMessage(msg))
    ]);

    workerContext.postMessage({ type: 'ESI_METRICS_UPDATE', payload: batchedPayload });

  } catch (err) {
    logger.error(`ESI Worker: Critical error in character loop for ${charId}:`, err);
    throw err;
  }
}
