import { get, update } from "idb-keyval";
import { StorageError } from "../auth/AuthRepository";
import type { EsiWalletJournalEntry } from "../schemas/esi";

export type WalletJournalDictionary = Record<string, EsiWalletJournalEntry[]>;

const WALLET_JOURNAL_STORE_KEY = "eve_wallet_journal";

/**
 * Retrieves the full dictionary of character wallet journals.
 */
export async function getWalletJournalDictionary(): Promise<WalletJournalDictionary> {
  try {
    const data = await get<WalletJournalDictionary>(WALLET_JOURNAL_STORE_KEY);
    return data || {};
  } catch (error) {
    throw new StorageError("Failed to get wallet journal dictionary from storage", error);
  }
}

/**
 * Adds or updates wallet journal entries for a specific character.
 */
export async function saveCharacterWalletJournal(
  characterId: string,
  entries: EsiWalletJournalEntry[]
): Promise<void> {
  try {
    await update<WalletJournalDictionary>(WALLET_JOURNAL_STORE_KEY, (val) => {
      const dict = val || {};
      dict[characterId] = entries;
      return dict;
    });
  } catch (error) {
    throw new StorageError(`Failed to save wallet journal for character ${characterId} in storage`, error);
  }
}

/**
 * Retrieves wallet journal entries for a specific character.
 */
export async function getCharacterWalletJournal(characterId: string): Promise<EsiWalletJournalEntry[]> {
  const dict = await getWalletJournalDictionary();
  return dict[characterId] || [];
}
