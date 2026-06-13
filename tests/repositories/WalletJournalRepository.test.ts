import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWalletJournalDictionary, saveCharacterWalletJournal, getCharacterWalletJournal } from '../../src/repositories/WalletJournalRepository';
import { EsiWalletJournalEntry } from '../../src/schemas/esi/walletJournal';
import { StorageError } from '../../src/auth/AuthRepository';
import * as idb from 'idb-keyval';
import 'fake-indexeddb/auto';

let failIdb = false;
vi.mock('idb-keyval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('idb-keyval')>();
  return {
    ...actual,
    get: async (...args: Parameters<typeof actual.get>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.get(...args);
    },
    set: async (...args: Parameters<typeof actual.set>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.set(...args);
    },
    update: async (...args: Parameters<typeof actual.update>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.update(...args);
    }
  };
});

describe('WalletJournalRepository', () => {
  beforeEach(async () => {
    failIdb = false;
    await idb.clear();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gets dictionary', async () => {
    await idb.set('eve_wallet_journal', { char1: [] });
    const dict = await getWalletJournalDictionary();
    expect(dict).toEqual({ char1: [] });
  });

  it('filters out non-actionable ref_types and old entries', async () => {
    await idb.del('eve_wallet_journal');
    
    const mockEntries = [
      { id: 1, ref_type: 'bounty_prizes', date: '2025-01-01T10:00:00Z' }, // Keep
      { id: 2, ref_type: 'unknown_type', date: '2025-01-01T10:00:00Z' }, // Filter out (non-actionable)
      { id: 3, ref_type: 'market_transaction', date: '2024-10-01T10:00:00Z' } // Filter out (older than 45 days)
    ];

    await saveCharacterWalletJournal('char1', mockEntries as unknown as EsiWalletJournalEntry[]);
    const dict = await idb.get('eve_wallet_journal');
    
    expect(dict?.char1.length).toBe(1);
    expect(dict?.char1[0].id).toBe(1);
  });

  it('gets character wallet journal', async () => {
    await idb.set('eve_wallet_journal', { char1: [{ id: 1 }] });
    const dict = await getCharacterWalletJournal('char1');
    expect(dict).toEqual([{ id: 1 }]);
  });

  it('fails loudly with StorageError on IDB read failure', async () => {
    failIdb = true;
    await expect(getWalletJournalDictionary()).rejects.toThrow(StorageError);
  });

  it('fails loudly with StorageError on IDB write failure', async () => {
    failIdb = true;
    await expect(saveCharacterWalletJournal('char1', [])).rejects.toThrow(StorageError);
  });
});
