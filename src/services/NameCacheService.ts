import { get, set } from 'idb-keyval';
import type { IEsiService } from './esi/IEsiService';
import { logger } from '../utils/logger';

const CACHE_KEY = 'eve_name_cache';

export class NameCacheService {
  /**
   * Resolves a list of EVE IDs to their names.
   * Utilizes IndexedDB for caching to minimize ESI API calls.
   * 
   * @param ids - An array of EVE IDs (characters, corporations, alliances, etc.)
   * @param esiService - An instance of IEsiService to perform API calls if needed
   * @returns A promise resolving to a dictionary mapping IDs to their resolved names
   */
  async resolveIdsToNames(ids: number[], esiService: IEsiService): Promise<Record<number, string>> {
    if (!ids || ids.length === 0) {
      return {};
    }

    // Filter out invalid or zero IDs, and IDs that ESI /universe/names/ doesn't support
    // Helper function to check if ID should be resolved via ESI /universe/names/
    // Avoids sending known unresolvable IDs (e.g. Planets, Stars, Player Structures)
    const isResolvableId = (id: number) => {
      const CELESTIAL_MIN = 40000000;
      const CELESTIAL_MAX = 60000000;
      const PLAYER_STRUCTURE_MIN = 1000000000000;

      if (typeof id !== 'number' || id <= 0) return false;
      if (id >= CELESTIAL_MIN && id < CELESTIAL_MAX) return false; // Celestials / Stargates
      if (id > PLAYER_STRUCTURE_MIN) return false; // Player Structures
      return true;
    };

    const validIds = ids.filter(isResolvableId);
    if (validIds.length === 0) {
      return {};
    }

    // Deduplicate requested IDs
    const uniqueIds = Array.from(new Set(validIds));
    
    // Load the current cache
    const cache: Record<number, string> = await get(CACHE_KEY) || {};
    
    const missingIds: number[] = [];
    const result: Record<number, string> = {};

    // Check which IDs are already in the cache
    for (const id of uniqueIds) {
      if (cache[id]) {
        result[id] = cache[id];
      } else {
        missingIds.push(id);
      }
    }

    // If there are missing IDs, fetch them from ESI
    if (missingIds.length > 0) {
      let cacheUpdated = false;

      try {
        const response = await esiService.resolveNames(missingIds);
        
        if (response && response.data) {
          for (const resolved of response.data) {
            result[resolved.id] = resolved.name;
            cache[resolved.id] = resolved.name;
            cacheUpdated = true;
          }
        }
      } catch {
        logger.warn('Failed to resolve names in bulk, attempting individual fallback for ' + missingIds.length + ' IDs.');
        // Fallback: Resolve 1 by 1 to isolate the bad ID
        for (const id of missingIds) {
          try {
            const singleResponse = await esiService.resolveNames([id]);
            if (singleResponse && singleResponse.data && singleResponse.data.length > 0) {
              const resolved = singleResponse.data[0];
              if (resolved) {
                result[resolved.id] = resolved.name;
                cache[resolved.id] = resolved.name;
                cacheUpdated = true;
              } else {
                cache[id] = `Unknown (${id})`;
                result[id] = cache[id];
                cacheUpdated = true;
              }
            } else {
              // Cache as unknown to prevent infinite retries for this session
              cache[id] = `Unknown (${id})`;
              result[id] = cache[id];
              cacheUpdated = true;
            }
          } catch {
            logger.warn(`ESI rejected resolution for individual ID: ${id}`);
            // Cache as unknown to prevent infinite retries
            cache[id] = `Unknown (${id})`;
            result[id] = cache[id];
            cacheUpdated = true;
          }
        }
      }

      // Persist the updated cache back to IndexedDB
      if (cacheUpdated) {
        await set(CACHE_KEY, cache);
      }
    }

    return result;
  }
}
