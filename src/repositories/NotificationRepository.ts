import { get, update } from "idb-keyval";
import { StorageError } from "../auth/AuthRepository";
import type { EsiNotification } from "../schemas/esi";

export type NotificationsDictionary = Record<string, EsiNotification[]>;

const NOTIFICATIONS_STORE_KEY = "eve_notifications";

/**
 * Retrieves the full dictionary of character notifications.
 */
export async function getNotificationsDictionary(): Promise<NotificationsDictionary> {
  try {
    const data = await get<NotificationsDictionary>(NOTIFICATIONS_STORE_KEY);
    return data || {};
  } catch (error) {
    throw new StorageError("Failed to get notifications dictionary from storage", error);
  }
}

/**
 * Adds or updates notifications for a specific character.
 */
export async function saveCharacterNotifications(
  characterId: string,
  notifications: EsiNotification[]
): Promise<void> {
  try {
    await update<NotificationsDictionary>(NOTIFICATIONS_STORE_KEY, (val) => {
      const dict = val || {};
      dict[characterId] = notifications;
      return dict;
    });
  } catch (error) {
    throw new StorageError(`Failed to save notifications for character ${characterId} in storage`, error);
  }
}

/**
 * Retrieves notifications for a specific character.
 */
export async function getCharacterNotifications(characterId: string): Promise<EsiNotification[]> {
  const dict = await getNotificationsDictionary();
  return dict[characterId] || [];
}

