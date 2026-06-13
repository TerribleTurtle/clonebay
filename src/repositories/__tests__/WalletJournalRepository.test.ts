import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWalletJournalDictionary, saveCharacterWalletJournal, getCharacterWalletJournal } from '../WalletJournalRepository';
import * as idb from 'idb-keyval';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  update: vi.fn()
}));

describe('WalletJournalRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gets dictionary', async () => {
    vi.mocked(idb.get).mockResolvedValue({ char1: [] });
    const dict = await getWalletJournalDictionary();
    expect(dict).toEqual({ char1: [] });
  });

  it('filters out non-actionable ref_types and old entries', async () => {
    let savedDict: Record<string, { id: number }[]> = {};
    vi.mocked(idb.update).mockImplementation(async (_key, updater) => {
      savedDict = updater({}) as Record<string, { id: number }[]>;
    });

    const entries = [
      { id: 1, ref_type: 'bounty_prizes', date: '2026-06-10T12:00:00Z' }, // Valid, 3 days old
      { id: 2, ref_type: 'bounty_prizes', date: '2026-01-01T12:00:00Z' }, // Invalid, > 45 days old
      { id: 3, ref_type: 'unknown_type', date: '2026-06-10T12:00:00Z' }, // Invalid, not actionable
      { id: 4, ref_type: 'market_transaction', date: 'invalid_date' } // Invalid date
    ];

    await saveCharacterWalletJournal('char1', entries as Parameters<typeof saveCharacterWalletJournal>[1]);
    expect(savedDict['char1']?.length).toBe(1);
    expect(savedDict['char1']?.[0]?.id).toBe(1);
  });

  it('gets character wallet journal', async () => {
    vi.mocked(idb.get).mockResolvedValue({ char1: [{ id: 1 }] });
    const dict = await getCharacterWalletJournal('char1');
    expect(dict).toEqual([{ id: 1 }]);
  });
});
