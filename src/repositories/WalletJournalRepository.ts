import { get, set } from "idb-keyval";
import { StorageError } from "../auth/AuthRepository";
import type { EsiWalletJournalEntry } from "../schemas/esi";

const getStoreKey = (characterId: string) => `eve_wallet_journal_${characterId}`;

export async function saveCharacterWalletJournal(
  characterId: string,
  entries: EsiWalletJournalEntry[]
): Promise<void> {
  try {
    await set(getStoreKey(characterId), entries);
  } catch (error) {
    throw new StorageError(`Failed to save wallet journal for character ${characterId} in storage`, error);
  }
}

export async function getCharacterWalletJournal(characterId: string): Promise<EsiWalletJournalEntry[]> {
  try {
    const data = await get<EsiWalletJournalEntry[]>(getStoreKey(characterId));
    return data || [];
  } catch (error) {
    throw new StorageError(`Failed to get wallet journal for character ${characterId} from storage`, error);
  }
}
