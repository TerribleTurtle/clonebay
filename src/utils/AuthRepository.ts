import { get, update } from "idb-keyval";

export interface CharacterAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  characterName: string;
}

export type AuthDictionary = Record<string, CharacterAuth>;

const AUTH_STORE_KEY = "eve_auth_tokens";

/**
 * Retrieves the full dictionary of authenticated characters.
 */
export async function getAuthDictionary(): Promise<AuthDictionary> {
  const data = await get<AuthDictionary>(AUTH_STORE_KEY);
  return data || {};
}

/**
 * Overwrites the entire auth dictionary.
 */
export async function setAuthDictionary(dict: AuthDictionary): Promise<void> {
  await update<AuthDictionary>(AUTH_STORE_KEY, () => dict);
}

/**
 * Adds or updates a specific character in the dictionary.
 */
export async function addOrUpdateCharacter(
  characterId: string,
  authData: CharacterAuth
): Promise<void> {
  await update<AuthDictionary>(AUTH_STORE_KEY, (val) => {
    const dict = val || {};
    dict[characterId] = authData;
    return dict;
  });
}

/**
 * Removes a character from the auth dictionary.
 */
export async function removeCharacter(characterId: string): Promise<void> {
  await update<AuthDictionary>(AUTH_STORE_KEY, (val) => {
    const dict = val || {};
    delete dict[characterId];
    return dict;
  });
}
