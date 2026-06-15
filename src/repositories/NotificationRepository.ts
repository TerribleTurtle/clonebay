import { get, set } from "idb-keyval";
import { StorageError } from "../auth/AuthRepository";
import type { EsiNotification } from "../schemas/esi";

const getStoreKey = (characterId: string) => `eve_notifications_${characterId}`;

export async function saveCharacterNotifications(
  characterId: string,
  notifications: EsiNotification[]
): Promise<void> {
  try {
    await set(getStoreKey(characterId), notifications);
  } catch (error) {
    throw new StorageError(`Failed to save notifications for character ${characterId} in storage`, error);
  }
}

export async function getCharacterNotifications(characterId: string): Promise<EsiNotification[]> {
  try {
    const data = await get<EsiNotification[]>(getStoreKey(characterId));
    return data || [];
  } catch (error) {
    throw new StorageError(`Failed to get notifications for character ${characterId} from storage`, error);
  }
}
