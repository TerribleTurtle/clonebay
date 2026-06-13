import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NameCacheService } from '../../src/services/NameCacheService';
import * as idbKeyval from 'idb-keyval';
import { logger } from '../../src/utils/logger';
import { IEsiService } from '../../src/services/esi/IEsiService';

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
  let mockEsiService: IEsiService;

  beforeEach(() => {
    mockEsiService = {
      resolveNames: vi.fn(),
    } as unknown as IEsiService;

    service = new NameCacheService(mockEsiService);
    vi.mocked(idbKeyval.get).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should test error logging when ESI resolveNames returns null', async () => {
    // Return a null response simulating failure
    vi.mocked(mockEsiService.resolveNames).mockResolvedValue(null);

    const result = await service.resolveIdsToNames([123, 456]);
    
    // It should not throw, but log an error and return empty resolution (or whatever was cached)
    expect(result).toEqual({});
    expect(logger.error).toHaveBeenCalledWith('ESI /universe/names/ request failed or returned null.');
  });

  it('should successfully resolve and cache new ids', async () => {
    vi.mocked(mockEsiService.resolveNames).mockResolvedValue({
      status: 'Green',
      cached: false,
      data: [{ id: 123, name: 'Test Name 123', category: 'character' }]
    });

    const result = await service.resolveIdsToNames([123]);
    expect(result).toEqual({ 123: 'Test Name 123' });
    expect(idbKeyval.set).toHaveBeenCalledWith('eve_name_cache', { 123: 'Test Name 123' });
  });
});

