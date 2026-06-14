import { logger } from "../../utils/logger";
import { processNotifications } from "../processors/notificationProcessor";
import { saveCharacterNotifications } from "../../repositories/NotificationRepository";
import type { IEsiService } from "../../services/esi/IEsiService";
import type { WorkerContext } from "../types";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessNotifications(charId: string, workerContext: WorkerContext, esiService: IEsiService, cache: EsiRequestCache) {
  try {
    const notificationsResponse = await cache.getNotifications();
    if (notificationsResponse && notificationsResponse.data) {
      await saveCharacterNotifications(charId, notificationsResponse.data);
      await processNotifications(charId, notificationsResponse.data, esiService, (msg) => workerContext.postMessage(msg));
    }
  } catch (err) {
    logger.error(`ESI Worker: Error fetching/saving notifications for ${charId}`, err);
    throw err;
  }
}
