import { get, set, keys, del } from 'idb-keyval';
import { logger } from '../../utils/logger';

const DEFAULT_CACHE_MINUTES = 5;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MAX_CACHE_ENTRIES = 500; // Limit to prevent unbounded growth
const GC_PROBABILITY = 0.1;

export interface CacheEntry<T> {
  data: T;
  eTag: string | null;
  expires: number;
  lastAccessed?: number;
}

// Background GC
async function enforceCacheLimits(nowMs: number) {
  try {
    const allKeys = await keys();
    const esiKeys = allKeys.filter((k): k is string => typeof k === 'string' && k.startsWith('https://'));
    
    if (esiKeys.length <= MAX_CACHE_ENTRIES) return;

    const entries = await Promise.all(
      esiKeys.map(async key => {
        const entry = await get<CacheEntry<unknown>>(key);
        return { key, entry };
      })
    );

    entries.sort((a, b) => {
      if (!a.entry) return 1;
      if (!b.entry) return -1;
      if (a.entry.expires < nowMs && b.entry.expires >= nowMs) return -1;
      if (b.entry.expires < nowMs && a.entry.expires >= nowMs) return 1;
      return (a.entry.lastAccessed || 0) - (b.entry.lastAccessed || 0);
    });

    const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
    await Promise.all(toDelete.map(e => del(e.key)));
  } catch (err) {
    logger.error('Failed to enforce cache limits', err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getCachedEsiData<T>(url: string, _nowMs: number): Promise<CacheEntry<T> | null> {
  try {
    const entry = await get<CacheEntry<T>>(url);
    if (entry !== undefined) {
      entry.lastAccessed = Date.now();
      await set(url, entry);
      return entry;
    }
    return null;
  } catch (error) {
    logger.error(`Failed to get cache for ${url}`, error);
    throw error;
  }
}

export async function setCachedEsiData<T>(
  url: string,
  data: T,
  eTag: string | null,
  expiresHeader: string | null,
  nowMs: number
): Promise<void> {
  try {
    let expires = nowMs + DEFAULT_CACHE_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND;
    if (expiresHeader !== null) {
      // eslint-disable-next-line no-restricted-syntax
      const parsed = Date.parse(expiresHeader);
      if (!Number.isNaN(parsed)) {
        expires = parsed;
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      eTag,
      expires,
      lastAccessed: Date.now()
    };
    
    await set(url, entry);
    
    // Probabilistic background GC to avoid blocking main thread on every request
    if (Math.random() < GC_PROBABILITY) {
      enforceCacheLimits(nowMs).catch(() => {});
    }
  } catch (error) {
    logger.error(`Failed to set cache for ${url}`, error);
    throw error;
  }
}
