import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStructures } from '../../src/workers/processors/structureProcessor';

describe('structureProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEsiService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCache: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    mockEsiService = {
      getCharacterRoles: vi.fn(),
      getPublicCharacterInfo: vi.fn(),
      getCorporationStructures: vi.fn()
    };
    mockCache = new Map();
  });

  it('should post Green status and empty data when character has no roles', async () => {
    mockEsiService.getCharacterRoles.mockResolvedValue({
      data: { roles_at_hq: [], roles_at_base: [], roles_at_other: [] }
    });

    await processStructures('char-1', mockEsiService, 'token', mockCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'structures', status: 'Green', data: [] }
    });
  });

  it('should intercept errors cleanly and post Red status', async () => {
    mockEsiService.getCharacterRoles.mockRejectedValue(new Error('ESI Error'));

    await processStructures('char-1', mockEsiService, 'token', mockCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'structures', status: 'Red', data: null }
    });
  });

  it('should use cache for corporation structures to avoid 429 limits', async () => {
    mockEsiService.getCharacterRoles.mockResolvedValue({
      data: { roles_at_hq: ['Station_Manager'], roles_at_base: [], roles_at_other: [] }
    });
    mockEsiService.getPublicCharacterInfo.mockResolvedValue({
      data: { corporation_id: 12345 }
    });

    const mockStructures = [{ structure_id: 1, type_id: 100, name: 'Citadel' }];
    const structuresPromise = Promise.resolve({ data: mockStructures });
    mockCache.set(12345, structuresPromise);

    await processStructures('char-1', mockEsiService, 'token', mockCache, mockPostMessage);

    // It shouldn't have called getCorporationStructures since cache is hit
    expect(mockEsiService.getCorporationStructures).not.toHaveBeenCalled();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'structures', status: 'Green', data: mockStructures }
    });
  });
});
