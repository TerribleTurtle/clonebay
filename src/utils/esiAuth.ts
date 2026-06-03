import { z } from 'zod';
import { getAuthDictionary, addOrUpdateCharacter } from './AuthRepository';
import { logger } from './logger';

export const EsiTokenRefreshResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().int().optional(),
  token_type: z.string().optional(),
  refresh_token: z.string().optional(),
}).passthrough();

const refreshPromises: Record<string, Promise<string>> = {};

export async function refreshAccessToken(characterId: string): Promise<string> {
  const authDict = await getAuthDictionary();
  const auth = authDict[characterId];
  if (!auth) {
    throw new Error(`No auth data found for character ${characterId}`);
  }

  if (!refreshPromises[characterId]) {
    refreshPromises[characterId] = (async () => {
      try {
        const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'] || '';
        if (!clientId) {
          throw new Error("NEXT_PUBLIC_EVE_CLIENT_ID is missing in worker context!");
        }
        let refreshResponse;
        try {
          refreshResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: auth.refreshToken,
              client_id: clientId,
            }),
          });
        } catch (error) {
          logger.error(`Network error refreshing access token for character ${characterId}`, error);
          throw new Error(`Network error refreshing access token for character ${characterId}: ${error}`);
        }
        if (refreshResponse.ok) {
          const rawData = await refreshResponse.json();
          const refreshData = EsiTokenRefreshResponseSchema.parse(rawData);
          
          auth.accessToken = refreshData.access_token;
          if (refreshData.refresh_token) {
            auth.refreshToken = refreshData.refresh_token;
          }
          await addOrUpdateCharacter(characterId, auth);
          return auth.accessToken;
        } else {
          throw new Error(`ESI OAuth Refresh failed with status ${refreshResponse.status}`);
        }
      } finally {
        delete refreshPromises[characterId];
      }
    })();
  }

  return refreshPromises[characterId];
}
