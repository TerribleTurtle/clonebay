import { getCachedEsiData, setCachedEsiData } from './esiCache';
import { logger } from './logger';
import { z } from 'zod';
import { enqueueRequest, dequeueRequest } from './esiQueue';
import { checkDailyDowntime, getAdjustedNow, isPaused, updateClockDrift, checkAndApplyRateLimitError, sleep } from './esiRateLimit';
import { refreshAccessToken } from './esiAuth';

const DEFAULT_RETRIES = 3;
const HTTP_STATUS_NOT_MODIFIED = 304;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const BACKOFF_BASE = 2;
const MS_PER_SECOND = 1000;

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

export { getAdjustedNow, checkDailyDowntime, resetGlobalPauseForTests } from './esiRateLimit';
export { resetQueueForTests } from './esiQueue';

export async function fetchEsi<T>(options: EsiRequestOptions<T>, retries: number = DEFAULT_RETRIES): Promise<EsiResponse<T>> {
  if (checkDailyDowntime()) {
    logger.warn("ESI is offline for daily downtime (11:00-11:15 UTC).");
    return { data: null, status: 'Offline', cached: false };
  }

  const { url, characterId } = options;

  try {
    const cachedEntry = await getCachedEsiData<T>(url);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${options.accessToken}`,
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

    if (isPaused()) {
      logger.warn("Global pause is active due to rate limits.");
      return { data: null, status: 'Offline', cached: false };
    }

    await enqueueRequest();

    try {
      const response = await fetch(url, { headers });

      updateClockDrift(response.headers.get('Date'));
      checkAndApplyRateLimitError(response.headers.get('X-Esi-Error-Limit-Remain'));

      if (response.status === HTTP_STATUS_NOT_MODIFIED && cachedEntry !== null) {
        const expiresHeader = response.headers.get('Expires');
        await setCachedEsiData(url, cachedEntry.data, cachedEntry.eTag, expiresHeader);
        dequeueRequest();
        return { data: cachedEntry.data, status: 'Green', cached: true };
      }

      if (response.status === HTTP_STATUS_UNAUTHORIZED) {
        try {
          options.accessToken = await refreshAccessToken(characterId);
        } catch (refreshError) {
          logger.error('Failed to refresh token:', refreshError);
          dequeueRequest();
          throw refreshError;
        }
        
        dequeueRequest();
        return fetchEsi<T>(options, retries);
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
