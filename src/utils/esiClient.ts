import { getCachedEsiData, setCachedEsiData } from './esiCache';
import { getAuthDictionary, addOrUpdateCharacter } from './authStorage';
import { logger } from './logger';
import { z } from 'zod';

const DOWNTIME_HOUR_UTC = 11;
const DOWNTIME_DURATION_MINUTES = 15;
const DEFAULT_RETRIES = 3;
const CRITICAL_ERROR_LIMIT = 20;
const PAUSE_DURATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const HTTP_STATUS_NOT_MODIFIED = 304;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const BACKOFF_BASE = 2;
const MAX_CONCURRENT_REQUESTS = 5;

export interface EsiRequestOptions<T> {
  url: string;
  accessToken: string;
  characterId: string;
  schema: z.ZodSchema<T>;
}

export interface EsiResponse<T> {
  data: T | null;
  status: 'Green' | 'Yellow' | 'Red' | 'Offline';
  cached: boolean;
}

let isGlobalPauseActive = false;
let pauseUntil = 0;
let clockDriftOffset = 0;

let activeRequests = 0;
const requestQueue: (() => void)[] = [];

async function enqueueRequest(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    requestQueue.push(resolve);
  });
}

function dequeueRequest(): void {
  if (requestQueue.length > 0) {
    const resolve = requestQueue.shift();
    if (resolve) resolve();
  } else {
    activeRequests--;
  }
}

export function getAdjustedNow(): Date {
  return new Date(Date.now() + clockDriftOffset);
}

export function checkDailyDowntime(): boolean {
  const now = getAdjustedNow();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();

  if (hours === DOWNTIME_HOUR_UTC && minutes >= 0 && minutes < DOWNTIME_DURATION_MINUTES) {
    return true;
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetGlobalPauseForTests(): void {
  isGlobalPauseActive = false;
  pauseUntil = 0;
  clockDriftOffset = 0;
  activeRequests = 0;
  requestQueue.length = 0;
}

const refreshPromises: Record<string, Promise<string>> = {};

export async function fetchEsi<T>(options: EsiRequestOptions<T>, retries: number = DEFAULT_RETRIES): Promise<EsiResponse<T>> {
  if (checkDailyDowntime()) {
    logger.warn("ESI is offline for daily downtime (11:00-11:15 UTC).");
    return { data: null, status: 'Offline', cached: false };
  }

  const { url, accessToken, characterId } = options;

  try {
    const cachedEntry = await getCachedEsiData<T>(url);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    };

    if (cachedEntry !== null) {
      if (getAdjustedNow().getTime() < cachedEntry.expires) {
        return { data: cachedEntry.data, status: 'Green', cached: true };
      }
      if (cachedEntry.eTag !== null) {
        headers['If-None-Match'] = cachedEntry.eTag;
      }
    }

    if (isGlobalPauseActive && getAdjustedNow().getTime() < pauseUntil) {
      logger.warn("Global pause is active due to rate limits.");
      return { data: null, status: 'Offline', cached: false };
    } else if (isGlobalPauseActive && getAdjustedNow().getTime() >= pauseUntil) {
      isGlobalPauseActive = false;
    }

    await enqueueRequest();

    try {

      const response = await fetch(url, { headers });

      const dateHeader = response.headers.get('Date');
      if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime();
        const localTime = Date.now();
        clockDriftOffset = serverTime - localTime;
      }

      const errorLimitRemain = response.headers.get('X-Esi-Error-Limit-Remain');
      if (errorLimitRemain !== null) {
        const remain = parseInt(errorLimitRemain, 10);
        if (!Number.isNaN(remain) && remain < CRITICAL_ERROR_LIMIT) {
          logger.error(`ESI error limit critically low: ${remain}. Pausing all requests for ${PAUSE_DURATION_SECONDS} seconds.`);
          isGlobalPauseActive = true;
          pauseUntil = getAdjustedNow().getTime() + PAUSE_DURATION_SECONDS * MS_PER_SECOND;
        }
      }

      if (response.status === HTTP_STATUS_NOT_MODIFIED && cachedEntry !== null) {
        const expiresHeader = response.headers.get('Expires');
        await setCachedEsiData(url, cachedEntry.data, cachedEntry.eTag, expiresHeader);
        dequeueRequest();
        return { data: cachedEntry.data, status: 'Green', cached: true };
      }

      if (response.status === HTTP_STATUS_UNAUTHORIZED) {
        const authDict = await getAuthDictionary();
        const auth = authDict[characterId];
        if (auth) {
          if (!refreshPromises[characterId]) {
            refreshPromises[characterId] = (async () => {
              try {
                const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'] || '';
                if (!clientId) {
                  throw new Error("NEXT_PUBLIC_EVE_CLIENT_ID is missing in worker context!");
                }
                const refreshResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: auth.refreshToken,
                    client_id: clientId,
                  }),
                });
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
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

          try {
            options.accessToken = await refreshPromises[characterId];
          } catch (refreshError) {
            logger.error('Failed to refresh token:', refreshError);
            throw refreshError;
          }
          
          dequeueRequest();
          return fetchEsi<T>(options, retries);
        }
      }

      if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS || response.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR) {
        if (retries > 0) {
          const attempt = DEFAULT_RETRIES - retries + 1;
          const backoff = Math.pow(BACKOFF_BASE, attempt - 1) * MS_PER_SECOND;
          logger.warn(`ESI returned ${response.status}. Retrying in ${backoff}ms...`);
          await sleep(backoff);
          dequeueRequest();
          return fetchEsi<T>(options, retries - 1);
        }
        throw new Error(`ESI request failed with status ${response.status} after retries.`);
      }

      if (!response.ok) {
        throw new Error(`ESI request failed with status ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      const data: T = options.schema.parse(rawData);
      const eTag = response.headers.get('ETag');
      const expiresHeader = response.headers.get('Expires');

      await setCachedEsiData(url, data, eTag, expiresHeader);

      dequeueRequest();
      return { data, status: 'Green', cached: false };
    } catch (innerError) {
      dequeueRequest();
      throw innerError;
    }

  } catch (error) {
    logger.error(`Error fetching ESI data for ${url}:`, error);
    throw error;
  }
}
