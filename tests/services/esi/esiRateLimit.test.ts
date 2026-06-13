import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkDailyDowntime,
  checkAndApplyRateLimitError,
  isPaused,
  updateClockDrift,
  getAdjustedNow,
  resetGlobalPauseForTests
} from '../../../src/services/esi/esiRateLimit';

describe('esiRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalPauseForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetGlobalPauseForTests();
  });

  it('should adjust time based on clock drift', () => {
    const localNow = new Date('2026-06-13T12:00:00Z').getTime();
    vi.setSystemTime(localNow);

    // Server is 5 minutes ahead
    const serverDateStr = new Date(localNow + 5 * 60 * 1000).toUTCString();
    updateClockDrift(serverDateStr);

    const adjusted = getAdjustedNow();
    expect(adjusted).toBe(localNow + 5 * 60 * 1000);
  });

  it('should identify daily downtime between 11:00 and 11:15 UTC', () => {
    // 11:05 UTC
    vi.setSystemTime(new Date('2026-06-13T11:05:00Z').getTime());
    expect(checkDailyDowntime()).toBe(true);
    
    // 11:15 UTC exactly (downtime over)
    vi.setSystemTime(new Date('2026-06-13T11:15:00Z').getTime());
    expect(checkDailyDowntime()).toBe(false);

    // 10:59 UTC
    vi.setSystemTime(new Date('2026-06-13T10:59:59Z').getTime());
    expect(checkDailyDowntime()).toBe(false);
  });

  it('should pause requests if X-Esi-Error-Limit-Remain drops below 20', () => {
    vi.setSystemTime(new Date('2026-06-13T12:00:00Z').getTime());
    
    checkAndApplyRateLimitError('19');
    expect(isPaused()).toBe(true);

    // After 60 seconds, it should be unpaused
    vi.advanceTimersByTime(60 * 1000);
    expect(isPaused()).toBe(false);
  });

  it('should not pause if limit is >= 20', () => {
    checkAndApplyRateLimitError('20');
    expect(isPaused()).toBe(false);
  });

  it('should handle invalid limit values gracefully', () => {
    checkAndApplyRateLimitError('invalid');
    expect(isPaused()).toBe(false);
    
    checkAndApplyRateLimitError(null);
    expect(isPaused()).toBe(false);
  });
});
