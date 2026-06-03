import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSdeType } from '../src/utils/sdeClient';
import { get, set } from 'idb-keyval';
import { HttpResponse, http } from 'msw';
import { server } from './setup';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

describe('sdeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data from IndexedDB if available', async () => {
    const mockCachedData = { capacity: 100, volume: 0.5, group_id: 10 };
    vi.mocked(get).mockResolvedValue(mockCachedData);

    const result = await fetchSdeType(1234);

    expect(get).toHaveBeenCalledWith('sde_type_1234');
    expect(result).toEqual(mockCachedData);
    expect(vi.mocked(set)).not.toHaveBeenCalled();
  });

  it('should fetch from ESI and cache to IndexedDB if not cached', async () => {
    vi.mocked(get).mockResolvedValue(undefined);

    // Provide a custom override for this specific test
    server.use(
      http.get('https://esi.evetech.net/latest/universe/types/:typeId/', () => {
        return HttpResponse.json({
          capacity: 200,
          volume: 1.5,
          group_id: 20,
          name: 'Test Type'
        });
      })
    );

    const result = await fetchSdeType(5678);

    expect(get).toHaveBeenCalledWith('sde_type_5678');
    expect(result).toEqual({ capacity: 200, volume: 1.5, group_id: 20 });
    expect(set).toHaveBeenCalledWith('sde_type_5678', { capacity: 200, volume: 1.5, group_id: 20 });
  });

  it('should throw an error if fetch fails', async () => {
    vi.mocked(get).mockResolvedValue(undefined);

    server.use(
      http.get('https://esi.evetech.net/latest/universe/types/:typeId/', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    await expect(fetchSdeType(9999)).rejects.toThrow('Failed to fetch SDE type 9999: Internal Server Error');
  });
});
