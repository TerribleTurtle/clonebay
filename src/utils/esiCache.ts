import { get, set } from 'idb-keyval';

const DEFAULT_CACHE_MINUTES = 5;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

export interface CacheEntry<T> {
  data: T;
  eTag: string | null;
  expires: number;
}

export async function getCachedEsiData<T>(url: string): Promise<CacheEntry<T> | null> {
  try {
    const entry = await get<CacheEntry<T>>(url);
    if (entry !== undefined) {
      if (entry.expires <= Date.now()) {
        return null;
      }
      return entry;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get cache for ${url}`, error);
    throw error;
  }
}

export async function setCachedEsiData<T>(
  url: string,
  data: T,
  eTag: string | null,
  expiresHeader: string | null
): Promise<void> {
  try {
    let expires = Date.now() + DEFAULT_CACHE_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND; // default 5 mins
    if (expiresHeader !== null) {
      const parsed = Date.parse(expiresHeader);
      if (!Number.isNaN(parsed)) {
        expires = parsed;
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      eTag,
      expires
    };
    
    await set(url, entry);
  } catch (error) {
    console.error(`Failed to set cache for ${url}`, error);
    throw error;
  }
}
