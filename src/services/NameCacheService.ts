import { get, set } from 'idb-keyval';
import { logger } from '../utils/logger';
import { IUniverseEsiService } from './esi/IEsiService';

const CACHE_KEY = 'eve_name_cache';
const MAX_CACHE_SIZE = 10000; // Limit unbounded growth

export class NameCacheService {
  constructor(private esiService: IUniverseEsiService) {}

  async resolveIdsToNames(ids: number[]): Promise<Record<number, string>> {
    if (!ids || ids.length === 0) {
      return {};
    }

    const isResolvableId = (id: number) => {
      const CELESTIAL_MIN = 40000000;
      const CELESTIAL_MAX = 60000000;
      const PLAYER_STRUCTURE_MIN = 1000000000000;

      if (typeof id !== 'number' || id <= 0) return false;
      if (id >= CELESTIAL_MIN && id < CELESTIAL_MAX) return false;
      if (id > PLAYER_STRUCTURE_MIN) return false;
      return true;
    };

    const validIds = ids.filter(isResolvableId);
    if (validIds.length === 0) {
      return {};
    }

    const uniqueIds = Array.from(new Set(validIds));
    
    const cache: Record<number, string> = await get(CACHE_KEY) || {};
    
    const missingIds: number[] = [];
    const result: Record<number, string> = {};

    for (const id of uniqueIds) {
      if (cache[id]) {
        result[id] = cache[id];
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length > 0) {
      let cacheUpdated = false;

      try {
        const response = await this.esiService.resolveNames(missingIds);

        if (response && response.data) {
          for (const resolvedName of response.data) {
            const id = resolvedName.id;
            const name = resolvedName.name;
            result[id] = name;
            cache[id] = name;
            cacheUpdated = true;
          }
        } else {
          logger.error(`ESI /universe/names/ request failed or returned null.`);
        }
      } catch (err) {
        logger.error(`Error resolving names via ESI:`, err);
      }

      if (cacheUpdated) {
        // Eviction logic: Prevent unbounded dictionary growth
        const cachedKeys = Object.keys(cache);
        if (cachedKeys.length > MAX_CACHE_SIZE) {
          const keysToRemove = cachedKeys.slice(0, cachedKeys.length - MAX_CACHE_SIZE);
          for (const key of keysToRemove) {
            delete cache[Number(key)];
          }
        }
        await set(CACHE_KEY, cache);
      }
    }

    return result;
  }
}
