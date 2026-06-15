import { NameCacheService } from "../../services/NameCacheService";
import type { EsiClones } from "../../schemas/esi";
import { logger } from "../logger";

export async function buildClonesContext(clones: EsiClones | undefined, nameCache: NameCacheService) {
  if (!clones?.jump_clones) return undefined;
  try {
    const idsToResolve = new Set<number>();
    for (const c of clones.jump_clones) {
      if (c.location_id) idsToResolve.add(c.location_id);
      if (c.implants) {
        c.implants.forEach((imp) => idsToResolve.add(imp));
      }
    }

    const resolvedNames = await nameCache.resolveIdsToNames(Array.from(idsToResolve));

    return clones.jump_clones.map((c) => ({
      locationName: c.location_id
        ? resolvedNames[c.location_id] || c.location_id.toString()
        : "Unknown",
      implants: c.implants
        ? c.implants.map((imp) => resolvedNames[imp] || imp.toString())
        : [],
    }));
  } catch (e) {
    logger.error(`Failed to build clones context`, e);
    throw e;
  }
}
