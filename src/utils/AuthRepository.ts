import { get, update, clear as idbClear } from "idb-keyval";

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

// -----------------------------------------------------------------------------
// PKCE Session Storage Encapsulation
// -----------------------------------------------------------------------------

export function setPkceState(state: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_state', state);
  }
}

export function getPkceState(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('oauth_state');
  }
  return null;
}

export function setCodeVerifier(verifier: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('code_verifier', verifier);
  }
}

export function getCodeVerifier(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('code_verifier');
  }
  return null;
}

export function clearPkceData(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('code_verifier');
  }
}


/**
 * Clears all auth data from IndexedDB.
 */
export async function clearAuthDictionary(): Promise<void> {
  await idbClear();
}
