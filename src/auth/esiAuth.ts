import { z } from 'zod';
import { getAuthDictionary, addOrUpdateCharacter } from './AuthRepository';
import { logger } from '../utils/logger';

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
          // eslint-disable-next-line no-restricted-globals
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
          const refreshData = await EsiTokenRefreshResponseSchema.parseAsync(rawData);
          
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
export const ESI_SCOPES = [
  "esi-skills.read_skillqueue.v1",
  "esi-skills.read_skills.v1",
  "esi-industry.read_character_jobs.v1",
  "esi-planets.manage_planets.v1",
  "esi-wallet.read_character_wallet.v1",
  "esi-location.read_location.v1",
  "esi-clones.read_clones.v1",
  "esi-characters.read_fatigue.v1",
  "esi-location.read_ship_type.v1",
  "esi-mail.read_mail.v1",
  "esi-contracts.read_character_contracts.v1",
  "esi-markets.read_character_orders.v1"
];

export function buildEsiAuthUrl(redirectUri: string, clientId: string, state: string, codeChallenge: string): string {
  const scopes = ESI_SCOPES.join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: scopes,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://login.eveonline.com/v2/oauth/authorize?${params.toString()}`;
}

