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
  expiresAt: number;
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

// -----------------------------------------------------------------------------
// PKCE Session Storage Encapsulation
// -----------------------------------------------------------------------------

/**
 * Stores the PKCE OAuth state parameter in session storage.
 * 
 * @param state - The generated state string.
 */
export function setPkceState(state: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_state', state);
  }
}

/**
 * Retrieves the PKCE OAuth state parameter from session storage.
 * 
 * @returns The state string, or null if not found.
 */
export function getPkceState(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('oauth_state');
  }
  return null;
}

/**
 * Stores the PKCE code verifier in session storage.
 * 
 * @param verifier - The generated code verifier string.
 */
export function setCodeVerifier(verifier: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('code_verifier', verifier);
  }
}

/**
 * Retrieves the PKCE code verifier from session storage.
 * 
 * @returns The code verifier string, or null if not found.
 */
export function getCodeVerifier(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('code_verifier');
  }
  return null;
}

/**
 * Clears all PKCE-related data from session storage.
 */
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
  try {
    await idbClear();
  } catch (error) {
    throw new StorageError("Failed to clear auth dictionary from storage", error);
  }
}
