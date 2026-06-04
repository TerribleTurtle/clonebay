import { DashboardStatus, DEFAULT_WALLET_MIN_THRESHOLD } from './core';

/**
 * Calculates the status of a character's wallet.
 * - RED: ISK is below the minimum threshold (default 100M).
 * - GREEN: ISK is above the threshold.
 *
 * @param isk - The character's current ISK balance, or null/undefined if unknown.
 * @param minThreshold - The minimum ISK threshold for 'Red' status (defaults to 100_000_000).
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for the wallet.
 */
export function calculateWalletStatus(
  isk?: number | null,
  minThreshold: number = DEFAULT_WALLET_MIN_THRESHOLD
): DashboardStatus {
  if (isk === undefined || isk === null) return 'Green';
  if (isk < minThreshold) return 'Red';
  return 'Green';
}

