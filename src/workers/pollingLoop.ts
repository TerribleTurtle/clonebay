import { get } from "idb-keyval";
import { logger } from "../utils/logger";
import { mockFleet } from "../utils/mockFleet";
import { LiveEsiService } from "../services/esi/LiveEsiService";
import { MockEsiService } from "../services/esi/MockEsiService";
import type { IEsiService } from "../services/esi/IEsiService";
import { NameCacheService } from "../services/NameCacheService";
import type { EsiResponse } from "../services/esi/esiClient";
import type { EsiCorporationStructure } from "../schemas/esi/corporation";
import { fetchCharacterData } from "./characterFetcher";
import type { WorkerContext } from "./types";

const POLLING_INTERVAL_SECONDS = 60;
const MS_PER_SECOND = 1000;

// Global state for polling loop
let isPolling = false;
let pollingTimeout: number | null = null;
let activeMockMode = false;

export async function handleWorkerMessage(event: MessageEvent, workerContext: WorkerContext) {
  const { type, isMockMode } = event.data;

  if (type === "PING") {
    workerContext.postMessage({ type: "PONG" });
  } else if (type === "START_POLLING") {
    if (!isPolling) {
      logger.info("ESI Worker: Polling started");
      activeMockMode = isMockMode || false;
      isPolling = true;
      pollLoop(workerContext);
    }
  } else if (type === "STOP_POLLING") {
    if (isPolling) {
      logger.info("ESI Worker: Polling stopped");
      if (pollingTimeout !== null) {
        workerContext.clearTimeout(pollingTimeout);
        pollingTimeout = null;
      }
      isPolling = false;
    }
  }
}

async function pollLoop(workerContext: WorkerContext) {
  if (!isPolling) return;
  const esiService: IEsiService = activeMockMode
    ? new MockEsiService()
    : new LiveEsiService();

  await pollData(esiService, workerContext);

  if (isPolling) {
    pollingTimeout = workerContext.setTimeout(
      () => pollLoop(workerContext),
      POLLING_INTERVAL_SECONDS * MS_PER_SECOND,
    );
  }
}

async function pollData(esiService: IEsiService, workerContext: WorkerContext): Promise<void> {
  const isMockMode = activeMockMode;
  const nameCache = new NameCacheService(esiService);
  const structuresCache = new Map<
    number,
    Promise<EsiResponse<EsiCorporationStructure[]> | null>
  >();
  let authTokens;
  try {
    authTokens = await get("eve_auth_tokens");
  } catch (err) {
    logger.error("ESI Worker: Failed to get auth tokens", err);
    return;
  }

  if (authTokens === undefined && !isMockMode) {
    logger.warn("ESI Worker: No auth tokens found in indexedDB.");
    return;
  }

  const characterIds = isMockMode
    ? mockFleet.map((c) => c.characterId)
    : Object.keys(authTokens || {});

  const characterPromises = characterIds.map(async (charId) => {
    const tokenInfo = authTokens ? authTokens[charId] : undefined;
    await fetchCharacterData(
      charId,
      tokenInfo,
      isMockMode,
      workerContext,
      esiService,
      nameCache,
      structuresCache
    );
  });

  await Promise.allSettled(characterPromises);
  workerContext.postMessage({ type: 'POLL_COMPLETE', timestamp: Date.now() });
}
