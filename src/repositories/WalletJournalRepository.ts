import { get, update } from "idb-keyval";
import { StorageError } from "../auth/AuthRepository";
import type { EsiWalletJournalEntry } from "../schemas/esi";

export type WalletJournalDictionary = Record<string, EsiWalletJournalEntry[]>;

const WALLET_JOURNAL_STORE_KEY = "eve_wallet_journal";

const ACTIONABLE_REF_TYPES = new Set([
  "bounty_prizes",
  "ess_escrow_transfer",
  "bounty_surcharge",
  "corporate_reward_payout",
  "corporate_reward_tax",
  "industry_job_tax",
  "reprocessing_tax",
  "planetary_import_tax",
  "planetary_export_tax",
  "facility_tax",
  "market_transaction",
  "market_escrow",
  "broker_fee",
  "transaction_tax",
  "player_donation",
  "player_trading"
]);

// eslint-disable-next-line no-magic-numbers
const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

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
 * Implements an Actionable Filter and a 45-Day Pruning Rule.
 */
export async function saveCharacterWalletJournal(
  characterId: string,
  entries: EsiWalletJournalEntry[]
): Promise<void> {
  try {
    const now = Date.now();
    
    // 1. Actionable Filter
    // 2. 45-Day Pruning Rule
    const filteredEntries = entries.filter((entry) => {
      if (!ACTIONABLE_REF_TYPES.has(entry.ref_type)) {
        return false;
      }
      
      const entryDateMs = new Date(entry.date).getTime();
      if (Number.isNaN(entryDateMs)) {
        return false; // Skip invalid dates
      }
      
      return (now - entryDateMs) <= FORTY_FIVE_DAYS_MS;
    });

    await update<WalletJournalDictionary>(WALLET_JOURNAL_STORE_KEY, (val) => {
      const dict = val || {};
      dict[characterId] = filteredEntries;
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
