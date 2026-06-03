import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { fetchEsi, checkDailyDowntime, resetGlobalPauseForTests, getAdjustedNow } from '../src/utils/esiClient';
import { getAuthDictionary } from '../src/utils/authStorage';
import { server } from './setup';

const MOCK_YEAR = 2023;
const DOWNTIME_HOUR = 11;
const DOWNTIME_MINUTE = 5;
const NON_DOWNTIME_HOUR = 12;

vi.mock('../src/utils/esiCache', () => ({
  getCachedEsiData: vi.fn().mockResolvedValue(null),
  setCachedEsiData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/utils/authStorage', () => ({
  getAuthDictionary: vi.fn().mockResolvedValue({}),
  addOrUpdateCharacter: vi.fn().mockResolvedValue(undefined),
}));

describe('ESI Client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalPauseForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should return Offline status during Daily Downtime (11:00-11:15 UTC)', async () => {
    // Mock time to 11:05 UTC
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, DOWNTIME_HOUR, DOWNTIME_MINUTE, 0));
    vi.setSystemTime(date);

    expect(checkDailyDowntime()).toBe(true);

    const result = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    });

    expect(result.status).toBe('Offline');
    expect(result.data).toBeNull();
  });

  it('should pause all requests when X-Esi-Error-Limit-Remain drops below 20', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', () => {
        return HttpResponse.json([{ skill_id: 1 }], {
          headers: { 'X-Esi-Error-Limit-Remain': '15' }
        });
      })
    );

    const result1 = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    });

    expect(result1.status).toBe('Green');

    const result2 = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    });

    expect(result2.status).toBe('Offline');
  });

  it('should refresh token on 401 and retry the request', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    vi.mocked(getAuthDictionary).mockResolvedValue({
      // @ts-expect-error - Testing missing types
      '123': { accessToken: 'old-token', refreshToken: 'valid-refresh-token' }
    });

    let attempt = 0;
    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', () => {
        attempt++;
        if (attempt === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json([{ skill_id: 2 }], {
          headers: { 'X-Esi-Error-Limit-Remain': '100' }
        });
      }),
      http.post('https://login.eveonline.com/v2/oauth/token', () => {
        return HttpResponse.json({ access_token: 'new-token', refresh_token: 'new-refresh-token' });
      })
    );

    const result = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'old-token',
      characterId: '123',
      schema: z.unknown()
    });

    expect(result.status).toBe('Green');
    expect(result.data).toEqual([{ skill_id: 2 }]);
    expect(attempt).toBe(2);
  });

  it('should correct clock drift when Date header is present', async () => {
    const localTime = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(localTime);

    // Server time is 5 minutes ahead
    const serverTime = new Date(localTime.getTime() + 5 * 60 * 1000);

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', () => {
        return HttpResponse.json([], {
          headers: { 'Date': serverTime.toUTCString() }
        });
      })
    );

    await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    });

    const adjustedNow = getAdjustedNow();
    expect(adjustedNow.getTime()).toBeGreaterThan(localTime.getTime());
    expect(adjustedNow.getTime()).toBeCloseTo(serverTime.getTime(), -2); // close to server time
  });

  it('should enforce MAX_CONCURRENT_REQUESTS = 5', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    let handlerCalls = 0;
    
    // Create a promise to artificially delay MSW response
    let unblockRequests: () => void;
    const blockPromise = new Promise<void>(resolve => {
      unblockRequests = resolve;
    });

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', async () => {
        handlerCalls++;
        await blockPromise;
        return HttpResponse.json([{ skill_id: handlerCalls }]);
      })
    );

    // Fire 6 requests instantly
    const requests = Array.from({ length: 6 }).map(() => fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    }));

    // Let the event loop process initial fetch calls
    await vi.advanceTimersByTimeAsync(10);
    
    // Only 5 should have hit the MSW handler because the 6th is queued by MAX_CONCURRENT_REQUESTS
    expect(handlerCalls).toBe(5);

    // Unblock the MSW handlers
    unblockRequests!();

    // Advance timers enough for MSW and fetch to settle
    await vi.advanceTimersByTimeAsync(100);

    await Promise.all(requests);

    // Now all 6 should have hit the handler
    expect(handlerCalls).toBe(6);
  });

  it('should handle HTTP 304 Not Modified when cached data is available', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    const mockEsiCache = await import('../src/utils/esiCache');
    vi.mocked(mockEsiCache.getCachedEsiData).mockResolvedValueOnce({
      data: [{ cached: true }],
      eTag: '"my-etag"',
      expires: date.getTime() - 1000 // expired so it fetches
    });

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', ({ request }) => {
        if (request.headers.get('If-None-Match') === '"my-etag"') {
          return new HttpResponse(null, { status: 304 });
        }
        return HttpResponse.json([]);
      })
    );

    const result = await fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    });

    expect(result.status).toBe('Green');
    expect(result.cached).toBe(true);
    expect(result.data).toEqual([{ cached: true }]);
  });

  it('Evil Test: Infinite 401 Loop Guard should throw loudly', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    vi.mocked(getAuthDictionary).mockResolvedValue({
      // @ts-expect-error - Testing missing types
      '123': { accessToken: 'old-token', refreshToken: 'valid-refresh-token' }
    });

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', () => {
        return new HttpResponse(null, { status: 401 });
      }),
      http.post('https://login.eveonline.com/v2/oauth/token', () => {
        return new HttpResponse(null, { status: 401 }); // Refresh ALSO returns 401
      })
    );

    await expect(fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'old-token',
      characterId: '123',
      schema: z.unknown()
    })).rejects.toThrow('ESI OAuth Refresh failed with status 401');
  });

  it('Evil Test: Phantom 304 Attack should fail cleanly', async () => {
    const date = new Date(Date.UTC(MOCK_YEAR, 1, 1, NON_DOWNTIME_HOUR, 0, 0));
    vi.setSystemTime(date);

    // Cache returns null, simulating empty cache
    const mockEsiCache = await import('../src/utils/esiCache');
    vi.mocked(mockEsiCache.getCachedEsiData).mockResolvedValueOnce(null);

    server.use(
      http.get('https://esi.evetech.net/latest/characters/123/skillqueue/', () => {
        return new HttpResponse(null, { status: 304, statusText: 'Not Modified' }); // Network incorrectly returns 304
      })
    );

    await expect(fetchEsi({
      url: 'https://esi.evetech.net/latest/characters/123/skillqueue/',
      accessToken: 'dummy-token',
      characterId: '123',
      schema: z.unknown()
    })).rejects.toThrow('ESI request failed with status 304: Not Modified');
  });
});
