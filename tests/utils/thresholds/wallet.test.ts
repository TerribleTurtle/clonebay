import { describe, it, expect } from 'vitest';
import { calculateWalletStatus } from '../../../src/utils/thresholds/wallet';
import { DEFAULT_WALLET_MIN_THRESHOLD } from '../../../src/utils/thresholds/core';
import walletJournalFixture from '../../fixtures/mockWalletJournal.json';

describe('calculateWalletStatus', () => {
  it('should return Green if isk is undefined or null', () => {
    expect(calculateWalletStatus(undefined)).toBe('Green');
    expect(calculateWalletStatus(null)).toBe('Green');
  });

  it('Exact Zero Boundary: should return Green when isk === minThreshold', () => {
    expect(calculateWalletStatus(DEFAULT_WALLET_MIN_THRESHOLD)).toBe('Green');
  });

  it('should return Red when isk < minThreshold', () => {
    expect(calculateWalletStatus(DEFAULT_WALLET_MIN_THRESHOLD - 1)).toBe('Red');
    expect(calculateWalletStatus(DEFAULT_WALLET_MIN_THRESHOLD - 0.01)).toBe('Red');
  });

  it('should return Green when isk > minThreshold', () => {
    expect(calculateWalletStatus(DEFAULT_WALLET_MIN_THRESHOLD + 1)).toBe('Green');
  });

  it('should support custom minThreshold', () => {
    const customThreshold = 500_000_000;
    expect(calculateWalletStatus(500_000_000, customThreshold)).toBe('Green'); // Exact boundary
    expect(calculateWalletStatus(499_999_999, customThreshold)).toBe('Red');
  });

  it('should handle fully hydrated mock structure from fixture', () => {
    // Extract balance from the first journal entry in the fixture
    const journalEntry = { ...walletJournalFixture[0] } as { balance: number };
    const balance = journalEntry.balance; // 1015000000.5
    
    // Should be green since 1B > 100M
    expect(calculateWalletStatus(balance)).toBe('Green');
    
    // Test with boundary override
    const poorEntry = { ...journalEntry, balance: DEFAULT_WALLET_MIN_THRESHOLD - 0.01 };
    expect(calculateWalletStatus(poorEntry.balance)).toBe('Red');
  });
});
