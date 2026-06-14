import { get, update, clear as idbClear } from "idb-keyval";

export class StorageError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export interface CharacterAuth {
  accessToken: string;
  refreshToken: string;
  characterName: string;
}

export type AuthDictionary = Record<string, CharacterAuth>;

const AUTH_STORE_KEY = "eve_auth_tokens";

/**
 * Retrieves the full dictionary of authenticated characters.
 */
export async function getAuthDictionary(): Promise<AuthDictionary> {
  try {
    const data = await get<AuthDictionary>(AUTH_STORE_KEY);
    return data || {};
  } catch (error) {
    throw new StorageError("Failed to get auth dictionary from storage", error);
  }
}

/**
 * Overwrites the entire auth dictionary.
 */
export async function setAuthDictionary(dict: AuthDictionary): Promise<void> {
  try {
    await update<AuthDictionary>(AUTH_STORE_KEY, () => dict);
  } catch (error) {
    throw new StorageError("Failed to set auth dictionary in storage", error);
  }
}

/**
 * Adds or updates a specific character in the dictionary.
 */
export async function addOrUpdateCharacter(
  characterId: string,
  authData: CharacterAuth
): Promise<void> {
  try {
    await update<AuthDictionary>(AUTH_STORE_KEY, (val) => {
      const dict = val || {};
      dict[characterId] = authData;
      return dict;
    });
  } catch (error) {
    throw new StorageError(`Failed to add or update character ${characterId} in storage`, error);
  }
}

/**
 * Removes a character from the auth dictionary.
 */
export async function removeCharacter(characterId: string): Promise<void> {
  try {
    await update<AuthDictionary>(AUTH_STORE_KEY, (val) => {
      const dict = val || {};
      delete dict[characterId];
      return dict;
    });
  } catch (error) {
    throw new StorageError(`Failed to remove character ${characterId} from storage`, error);
  }
}


/**
 * Clears all auth data from IndexedDB.
 */
export async function clearAuthDictionary(): Promise<void> {
  try {
    await idbClear();
  } catch (error) {
    throw new StorageError("Failed to clear auth dictionary from storage", error);
  }
}
