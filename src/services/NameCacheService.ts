import { get, set } from 'idb-keyval';
import { logger } from '../utils/logger';
import { IEsiService } from './esi/IEsiService';

const CACHE_KEY = 'eve_name_cache';

export class NameCacheService {
  constructor(private esiService: IEsiService) {}

  /**
   * Resolves a list of EVE IDs to their names.
   * Utilizes IndexedDB for caching to minimize ESI API calls.
   * 
   * @param ids - An array of EVE IDs (characters, corporations, alliances, etc.)
   * @returns A promise resolving to a dictionary mapping IDs to their resolved names
   */
  async resolveIdsToNames(ids: number[]): Promise<Record<number, string>> {
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

    // If there are missing IDs, fetch them from the ESI Service
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

      // Persist the updated cache back to IndexedDB
      if (cacheUpdated) {
        await set(CACHE_KEY, cache);
      }
    }

    return result;
  }
}
