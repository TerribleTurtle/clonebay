import { getAuthDictionary, addOrUpdateCharacter } from './AuthRepository';
import { fetchNewToken } from './esiAuth';

const refreshPromises: Record<string, Promise<string>> = {};

export async function refreshAccessToken(characterId: string): Promise<string> {
  const authDict = await getAuthDictionary();
  const auth = authDict[characterId];
  if (!auth) {
    throw new Error(`No auth data found for character ${characterId}`);
  }

  if (!refreshPromises[characterId]) {
    const refreshTask = (async () => {
      const { accessToken, refreshToken } = await fetchNewToken(characterId, auth.refreshToken);
      auth.accessToken = accessToken;
      if (refreshToken) {
        auth.refreshToken = refreshToken;
      }
      await addOrUpdateCharacter(characterId, auth);
      return auth.accessToken;
    })();

    const REFRESH_TIMEOUT_MS = 15000;
    const timeoutTask = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Refresh token request timed out')), REFRESH_TIMEOUT_MS);
    });

    const currentPromise = Promise.race([refreshTask, timeoutTask]).finally(() => {
      if (refreshPromises[characterId] === currentPromise) {
        delete refreshPromises[characterId];
      }
    });

    refreshPromises[characterId] = currentPromise;
  }

  return refreshPromises[characterId];
}
