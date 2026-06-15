import type { IEsiService } from "../../services/esi/IEsiService";
import { logger } from "../logger";

const ATTRIBUTE_SECONDARY_DIVISOR = 2;
const MINUTES_PER_HOUR = 60;

export async function buildSpContext(charId: string, totalSp: number | undefined, unallocatedSp: number, esiService: IEsiService, accessToken: string) {
  if (totalSp === undefined) return undefined;
  try {
    const attrsResponse = await esiService.character.getAttributes(charId, accessToken);
    if (!attrsResponse?.data) return undefined;

    const { intelligence, memory } = attrsResponse.data;
    const primary = intelligence || 0;
    const secondary = memory || 0;
    const ratePerHour = (primary + secondary / ATTRIBUTE_SECONDARY_DIVISOR) * MINUTES_PER_HOUR;
    
    return {
      current: totalSp,
      unallocated: unallocatedSp,
      ratePerHour,
    };
  } catch (e) {
    logger.error(`Failed to fetch attributes for SP rate context for ${charId}`, e);
    throw e;
  }
}
