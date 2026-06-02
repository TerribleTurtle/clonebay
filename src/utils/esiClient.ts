import { getCachedEsiData, setCachedEsiData } from './esiCache';

const DOWNTIME_HOUR_UTC = 11;
const DOWNTIME_DURATION_MINUTES = 15;
const DEFAULT_RETRIES = 3;
const CRITICAL_ERROR_LIMIT = 20;
const PAUSE_DURATION_SECONDS = 60;
const MS_PER_SECOND = 1000;
const HTTP_STATUS_NOT_MODIFIED = 304;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const BACKOFF_BASE = 2;

export interface EsiRequestOptions {
  url: string;
  accessToken: string;
  characterId: string;
}

export interface EsiResponse<T> {
  data: T | null;
  status: 'Green' | 'Yellow' | 'Red' | 'Offline';
  cached: boolean;
}

let isGlobalPauseActive = false;
let pauseUntil = 0;

export function checkDailyDowntime(): boolean {
  const now = new Date();
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
}

export async function fetchEsi<T>(options: EsiRequestOptions, retries: number = DEFAULT_RETRIES): Promise<EsiResponse<T>> {
  if (checkDailyDowntime()) {
    console.warn("ESI is offline for daily downtime (11:00-11:15 UTC).");
    return { data: null, status: 'Offline', cached: false };
  }

  if (isGlobalPauseActive && Date.now() < pauseUntil) {
    console.warn("Global pause is active due to rate limits.");
    return { data: null, status: 'Offline', cached: false };
  } else if (isGlobalPauseActive && Date.now() >= pauseUntil) {
    isGlobalPauseActive = false;
  }

  const { url, accessToken } = options;

  try {
    const cachedEntry = await getCachedEsiData<T>(url);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    };

    if (cachedEntry !== null) {
      if (Date.now() < cachedEntry.expires) {
        return { data: cachedEntry.data, status: 'Green', cached: true };
      }
      if (cachedEntry.eTag !== null) {
        headers['If-None-Match'] = cachedEntry.eTag;
      }
    }

    const response = await fetch(url, { headers });

    const errorLimitRemain = response.headers.get('X-Esi-Error-Limit-Remain');
    if (errorLimitRemain !== null) {
      const remain = parseInt(errorLimitRemain, 10);
      if (!Number.isNaN(remain) && remain < CRITICAL_ERROR_LIMIT) {
        console.error(`ESI error limit critically low: ${remain}. Pausing all requests for ${PAUSE_DURATION_SECONDS} seconds.`);
        isGlobalPauseActive = true;
        pauseUntil = Date.now() + PAUSE_DURATION_SECONDS * MS_PER_SECOND;
      }
    }

    if (response.status === HTTP_STATUS_NOT_MODIFIED && cachedEntry !== null) {
      const expiresHeader = response.headers.get('Expires');
      await setCachedEsiData(url, cachedEntry.data, cachedEntry.eTag, expiresHeader);
      return { data: cachedEntry.data, status: 'Green', cached: true };
    }

    if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS || response.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR) {
      if (retries > 0) {
        // Calculate attempt number (1, 2, 3) based on default 3 retries
        const attempt = DEFAULT_RETRIES - retries + 1;
        const backoff = Math.pow(BACKOFF_BASE, attempt - 1) * MS_PER_SECOND; // 1s, 2s, 4s
        console.warn(`ESI returned ${response.status}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
        return fetchEsi<T>(options, retries - 1);
      }
      throw new Error(`ESI request failed with status ${response.status} after retries.`);
    }

    if (!response.ok) {
      throw new Error(`ESI request failed with status ${response.status}: ${response.statusText}`);
    }

    const data: T = await response.json();
    const eTag = response.headers.get('ETag');
    const expiresHeader = response.headers.get('Expires');

    await setCachedEsiData(url, data, eTag, expiresHeader);

    return { data, status: 'Green', cached: false };

  } catch (error) {
    console.error(`Error fetching ESI data for ${url}:`, error);
    throw error;
  }
}
