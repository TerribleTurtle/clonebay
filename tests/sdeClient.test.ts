import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSdeType } from '../src/services/esi/sdeClient';
import { get, set } from 'idb-keyval';
import { HttpResponse, http } from 'msw';
import { server } from './setup';
import universeTypeRaw from './fixtures/universe_type.json';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

describe('sdeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data from IndexedDB if available', async () => {
    const mockCachedData = { ...universeTypeRaw, type_id: 2256 };
    vi.mocked(get).mockResolvedValue(mockCachedData);

    const result = await fetchSdeType(2256);

    expect(get).toHaveBeenCalledWith('sde_type_2256');
    expect(result).toEqual(mockCachedData);
    expect(vi.mocked(set)).not.toHaveBeenCalled();
  });

  it('should fetch from ESI and cache to IndexedDB if not cached', async () => {
    vi.mocked(get).mockResolvedValue(undefined);

    const fullMockData = {
      ...universeTypeRaw,
      type_id: 2588
    };

    // Provide a custom override for this specific test
    server.use(
      http.get('https://esi.evetech.net/latest/universe/types/:typeId/', () => {
        return HttpResponse.json(fullMockData);
      })
    );

    const result = await fetchSdeType(2588);

    expect(get).toHaveBeenCalledWith('sde_type_2588');
    expect(result).toEqual(fullMockData);
    expect(set).toHaveBeenCalledWith('sde_type_2588', fullMockData);
  });

  it('should throw an error if fetch fails', async () => {
    vi.mocked(get).mockResolvedValue(undefined);

    server.use(
      http.get('https://esi.evetech.net/latest/universe/types/:typeId/', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    await expect(fetchSdeType(2544)).rejects.toThrow('Failed to fetch SDE type 2544: Internal Server Error');
  });
});


