import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NameCacheService } from '../../src/services/NameCacheService';
import * as idbKeyval from 'idb-keyval';
import { logger } from '../../src/utils/logger';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn()
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

describe('NameCacheService', () => {
  let service: NameCacheService;

  beforeEach(() => {
    service = new NameCacheService();
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(idbKeyval.get).mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should test fallback isolation logic when bulk resolveIdsToNames returns a 404', async () => {
    // Return a 404 response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404
    } as unknown);

    const result = await service.resolveIdsToNames([123, 456]);
    
    // It should not throw, but log an error and return empty resolution (or whatever was cached)
    expect(result).toEqual({});
    expect(logger.error).toHaveBeenCalledWith('Edge Function /api/resolve failed with status: 404');
  });

  it('should successfully resolve and cache new ids', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ '123': 'Test Name 123' })
    } as unknown);

    const result = await service.resolveIdsToNames([123]);
    expect(result).toEqual({ 123: 'Test Name 123' });
    expect(idbKeyval.set).toHaveBeenCalledWith('eve_name_cache', { 123: 'Test Name 123' });
  });
});

