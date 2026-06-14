import { logger } from "../../utils/logger";
import { saveCharacterWalletJournal } from "../../repositories/WalletJournalRepository";
import type { EsiRequestCache } from "./EsiRequestCache";

export async function fetchAndProcessWalletJournal(charId: string, cache: EsiRequestCache) {
  try {
    const journalResponse = await cache.getWalletJournal();
    if (journalResponse && journalResponse.data) {
      await saveCharacterWalletJournal(charId, journalResponse.data);
    }
  } catch (err) {
    logger.error(`ESI Worker: Error fetching/saving wallet journal for ${charId}`, err);
    throw err;
  }
}
