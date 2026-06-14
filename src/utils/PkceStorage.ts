import { safeSessionStorage } from './storageAdapter';

/**
 * Stores the PKCE OAuth state parameter in session storage.
 * 
 * @param state - The generated state string.
 */
export function setPkceState(state: string): void {
  safeSessionStorage.setItem('oauth_state', state);
}

/**
 * Retrieves the PKCE OAuth state parameter from session storage.
 * 
 * @returns The state string, or null if not found.
 */
export function getPkceState(): string | null {
  return safeSessionStorage.getItem('oauth_state');
}

/**
 * Stores the PKCE code verifier in session storage.
 * 
 * @param verifier - The generated code verifier string.
 */
export function setCodeVerifier(verifier: string): void {
  safeSessionStorage.setItem('code_verifier', verifier);
}

/**
 * Retrieves the PKCE code verifier from session storage.
 * 
 * @returns The code verifier string, or null if not found.
 */
export function getCodeVerifier(): string | null {
  return safeSessionStorage.getItem('code_verifier');
}

/**
 * Clears all PKCE-related data from session storage.
 */
export function clearPkceData(): void {
  safeSessionStorage.removeItem('oauth_state');
  safeSessionStorage.removeItem('code_verifier');
}
