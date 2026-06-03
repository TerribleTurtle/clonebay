import { HttpClient, HttpInterceptor, HttpRequest } from './http/httpClient';
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

export const esiDowntimeInterceptor: HttpInterceptor = async (req, next) => {
  if (checkDailyDowntime()) {
    logger.warn("ESI is offline for daily downtime (11:00-11:15 UTC).");
    return { status: 503, headers: new Headers(), data: null, cached: false, esiStatus: 'Offline' };
  }
  return next(req);
};

export const esiCacheInterceptor: HttpInterceptor = async (req, next) => {
  const cachedEntry = await getCachedEsiData<any>(req.url);
  
  if (cachedEntry !== null) {
    if (getAdjustedNow().getTime() < cachedEntry.expires) {
      return { status: 200, headers: new Headers(), data: cachedEntry.data, cached: true, esiStatus: 'Green' };
    }
    if (cachedEntry.eTag !== null) {
      req.headers = { ...req.headers, 'If-None-Match': cachedEntry.eTag };
    }
  }

  const response = await next(req);

  if (response.status === HTTP_STATUS_NOT_MODIFIED && cachedEntry !== null) {
    const expiresHeader = response.headers.get('Expires');
    await setCachedEsiData(req.url, cachedEntry.data, cachedEntry.eTag, expiresHeader);
    return { ...response, status: 200, data: cachedEntry.data, cached: true, esiStatus: 'Green' };
  }

  if (response.status >= 200 && response.status < 300) {
    const eTag = response.headers.get('ETag');
    const expiresHeader = response.headers.get('Expires');
    await setCachedEsiData(req.url, response.data, eTag, expiresHeader);
  }

  return response;
};

export const esiPauseInterceptor: HttpInterceptor = async (req, next) => {
  if (isPaused()) {
    logger.warn("Global pause is active due to rate limits.");
    return { status: 503, headers: new Headers(), data: null, cached: false, esiStatus: 'Offline' };
  }
  return next(req);
};

export const esiQueueInterceptor: HttpInterceptor = async (req, next) => {
  await enqueueRequest();
  try {
    return await next(req);
  } finally {
    dequeueRequest();
  }
};

export const esiRateLimitInterceptor: HttpInterceptor = async (req, next) => {
  const response = await next(req);
  updateClockDrift(response.headers.get('Date'));
  checkAndApplyRateLimitError(response.headers.get('X-Esi-Error-Limit-Remain'));
  return response;
};

export const esiAuthInterceptor: HttpInterceptor = async (req, next) => {
  req.headers = {
    ...req.headers,
    'Authorization': `Bearer ${req.context.accessToken}`,
    'Accept': 'application/json'
  };

  const response = await next(req);

  if (response.status === HTTP_STATUS_UNAUTHORIZED) {
    try {
      if (!req.context.characterId) {
        throw new Error("Missing characterId for token refresh");
      }
      req.context.accessToken = await refreshAccessToken(req.context.characterId);
      req.headers['Authorization'] = `Bearer ${req.context.accessToken}`;
      return await next(req);
    } catch (refreshError) {
      logger.error('Failed to refresh token:', refreshError);
      throw refreshError;
    }
  }

  return response;
};

export const esiRetryInterceptor: HttpInterceptor = async (req, next) => {
  const maxRetries = req.context.retries ?? DEFAULT_RETRIES;
  
  const attempt = async (retriesLeft: number): Promise<any> => {
    const response = await next(req);
    
    if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS || response.status >= HTTP_STATUS_INTERNAL_SERVER_ERROR) {
      if (retriesLeft > 0) {
        const attemptNum = maxRetries - retriesLeft + 1;
        const backoff = Math.pow(BACKOFF_BASE, attemptNum - 1) * MS_PER_SECOND;
        logger.warn(`ESI returned ${response.status}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
        return attempt(retriesLeft - 1);
      }
      throw new Error(`ESI request failed with status ${response.status} after retries.`);
    }

    if (response.status >= 400 && response.status !== 401) {
      throw new Error(`ESI request failed with status ${response.status}`);
    }

    return response;
  };

  return attempt(maxRetries);
};

export const esiValidationInterceptor: HttpInterceptor = async (req, next) => {
  const response = await next(req);
  
  if (response.status === 200 && response.data && req.context.schema) {
    try {
      response.data = req.context.schema.parse(response.data);
    } catch (e) {
      logger.error(`Failed to parse ESI response for ${req.url}:`, e);
      throw e;
    }
  }
  
  return response;
};

export const esiClient = new HttpClient()
  .use(esiDowntimeInterceptor)
  .use(esiCacheInterceptor)
  .use(esiPauseInterceptor)
  .use(esiQueueInterceptor)
  .use(esiRateLimitInterceptor)
  .use(esiAuthInterceptor)
  .use(esiRetryInterceptor)
  .use(esiValidationInterceptor);

export async function fetchEsi<T>(options: EsiRequestOptions<T>, retries: number = DEFAULT_RETRIES): Promise<EsiResponse<T>> {
  try {
    const req: HttpRequest = {
      url: options.url,
      context: {
        characterId: options.characterId,
        accessToken: options.accessToken,
        schema: options.schema,
        retries
      }
    };
    const res = await esiClient.request(req);
    if (res.status === 304) {
      throw new Error('ESI request failed with status 304: Not Modified');
    }
    return {
      data: res.data as T,
      status: res.esiStatus,
      cached: res.cached
    };
  } catch (error) {
    logger.error(`Error fetching ESI data for ${options.url}:`, error);
    throw error;
  }
}
