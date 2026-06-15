import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveCharacterWalletJournal, getCharacterWalletJournal } from '../../src/repositories/WalletJournalRepository';
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

  it('saves character wallet journal entries', async () => {
    await idb.del('eve_wallet_journal_char1');
    
    const mockEntries = [
      { id: 1, ref_type: 'bounty_prizes', date: '2025-01-01T10:00:00Z' },
      { id: 2, ref_type: 'unknown_type', date: '2025-01-01T10:00:00Z' },
      { id: 3, ref_type: 'market_transaction', date: '2024-10-01T10:00:00Z' }
    ];

    await saveCharacterWalletJournal('char1', mockEntries as unknown as EsiWalletJournalEntry[]);
    const dict = await idb.get<EsiWalletJournalEntry[]>('eve_wallet_journal_char1');
    
    expect(dict).toBeDefined();
    expect(dict?.length).toBe(3);
    expect(dict?.[0]?.id).toBe(1);
    expect(dict?.[1]?.id).toBe(2);
    expect(dict?.[2]?.id).toBe(3);
  });

  it('gets character wallet journal', async () => {
    await idb.set('eve_wallet_journal_char1', [{ id: 1 }]);
    const dict = await getCharacterWalletJournal('char1');
    expect(dict).toEqual([{ id: 1 }]);
  });

  it('fails loudly with StorageError on IDB read failure', async () => {
    failIdb = true;
    await expect(getCharacterWalletJournal('char1')).rejects.toThrow(StorageError);
  });

  it('fails loudly with StorageError on IDB write failure', async () => {
    failIdb = true;
    await expect(saveCharacterWalletJournal('char1', [])).rejects.toThrow(StorageError);
  });
});
