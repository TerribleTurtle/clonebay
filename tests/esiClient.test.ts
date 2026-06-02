import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchEsi, checkDailyDowntime, resetGlobalPauseForTests } from '../src/utils/esiClient';

const MOCK_YEAR = 2023;
const DOWNTIME_HOUR = 11;
const DOWNTIME_MINUTE = 5;
const NON_DOWNTIME_HOUR = 12;

vi.mock('../src/utils/esiCache', () => ({
  getCachedEsiData: vi.fn().mockResolvedValue(null),
  setCachedEsiData: vi.fn().mockResolvedValue(undefined),
}));

describe('ESI Client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalPauseForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return Offline status during Daily Downtime (11:00-11:15 UTC)', async () => {
    // Mock time to 11:05 UTC
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, DOWNTIME_HOUR, DOWNTIME_MINUTE, 0));
    vi.setSystemTime(date);

    expect(checkDailyDowntime()).toBe(true);

    const result = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123'
    });

    expect(result.status).toBe('Offline');
    expect(result.data).toBeNull();
  });

  it('should pause all requests when X-Esi-Error-Limit-Remain drops below 20', async () => {
    // Mock time to 12:00 UTC (outside downtime)
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    // Mock fetch to return a low error limit remain header
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'X-Esi-Error-Limit-Remain': '15'
      }),
      json: vi.fn().mockResolvedValue([{ skill_id: 1 }])
    });

    const result1 = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123'
    });

    expect(result1.status).toBe('Green');

    // Next request should be blocked by the global pause
    const result2 = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123'
    });

    expect(result2.status).toBe('Offline');
  });
});
