import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCachedEsiData, setCachedEsiData } from '../src/utils/esiCache';
import { clear } from 'idb-keyval';

describe('esiCache', () => {
  beforeEach(async () => {
    await clear();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects past dates and expires data correctly', async () => {
    const url = 'https://api.eve.com/data';
    
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const pastDateStr = new Date('2026-01-01T09:00:00Z').toUTCString();
    
    await setCachedEsiData(url, { some: 'data' }, 'fake-etag', pastDateStr, Date.now());
    
    const result = await getCachedEsiData(url, Date.now());
    expect(result).toBeNull();
  });

  it('verifies ETag string caching logic', async () => {
    const url = 'https://api.eve.com/data2';
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const futureDateStr = new Date('2026-01-01T11:00:00Z').toUTCString();

    await setCachedEsiData(url, { some: 'data2' }, 'my-etag-123', futureDateStr, Date.now());

    const result = await getCachedEsiData(url, Date.now());
    expect(result).not.toBeNull();
    expect(result?.eTag).toBe('my-etag-123');
    expect(result?.data).toEqual({ some: 'data2' });
  });

  it('expires data when Date.now() equals expires exact time', async () => {
    const url = 'https://api.eve.com/data-exact';
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    const exactDateStr = new Date('2026-01-01T10:00:00Z').toUTCString();
    
    await setCachedEsiData(url, { some: 'data-exact' }, 'exact-etag', exactDateStr, Date.now());
    
    const result = await getCachedEsiData(url, Date.now());
    expect(result).toBeNull();
  });

  it('defaults to 5 minutes if expires header is un-parsable', async () => {
    const url = 'https://api.eve.com/data-unparsable';
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    
    await setCachedEsiData(url, { some: 'data-unparsable' }, 'unparsable-etag', 'invalid-date-string', Date.now());
    
    // Should be valid at 10:04
    vi.setSystemTime(new Date('2026-01-01T10:04:00Z'));
    const resultBefore = await getCachedEsiData(url, Date.now());
    expect(resultBefore).not.toBeNull();

    // Should be expired at 10:05
    vi.setSystemTime(new Date('2026-01-01T10:05:00Z'));
    const resultAfter = await getCachedEsiData(url, Date.now());
    expect(resultAfter).toBeNull();
  });

  it('defaults to 5 minutes if expires header is null', async () => {
    const url = 'https://api.eve.com/data-null';
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    
    await setCachedEsiData(url, { some: 'data-null' }, 'null-etag', null, Date.now());
    
    // Should be valid at 10:04
    vi.setSystemTime(new Date('2026-01-01T10:04:00Z'));
    const resultBefore = await getCachedEsiData(url, Date.now());
    expect(resultBefore).not.toBeNull();

    // Should be expired at 10:05
    vi.setSystemTime(new Date('2026-01-01T10:05:00Z'));
    const resultAfter = await getCachedEsiData(url, Date.now());
    expect(resultAfter).toBeNull();
  });
});
