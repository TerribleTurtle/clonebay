import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCachedEsiData, setCachedEsiData } from '../src/utils/esiCache';

let mockStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(async (key: string) => mockStore[key]),
    set: vi.fn(async (key: string, val: unknown) => { mockStore[key] = val; })
  };
});

describe('esiCache', () => {
  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects past dates and expires data correctly', async () => {
    const url = 'https://api.eve.com/data';
    
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const pastDateStr = new Date('2026-01-01T09:00:00Z').toUTCString();
    
    await setCachedEsiData(url, { some: 'data' }, 'fake-etag', pastDateStr);
    
    const result = await getCachedEsiData(url);
    expect(result).toBeNull();
  });

  it('verifies ETag string caching logic', async () => {
    const url = 'https://api.eve.com/data2';
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const futureDateStr = new Date('2026-01-01T11:00:00Z').toUTCString();

    await setCachedEsiData(url, { some: 'data2' }, 'my-etag-123', futureDateStr);

    const result = await getCachedEsiData(url);
    expect(result).not.toBeNull();
    expect(result?.eTag).toBe('my-etag-123');
    expect(result?.data).toEqual({ some: 'data2' });
  });
});
