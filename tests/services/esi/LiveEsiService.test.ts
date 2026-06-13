import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveEsiService } from '../../../src/services/esi/LiveEsiService';
import * as esiClientModule from '../../../src/services/esi/esiClient';
import { z } from 'zod';
import { logger } from '../../../src/utils/logger';

vi.mock('../../../src/services/esi/esiClient', () => ({
  fetchEsi: vi.fn()
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}));

describe('LiveEsiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data successfully from fetchEsi', async () => {
    const service = new LiveEsiService();
    const mockData = [{ skill_id: 1, skill_level: 5 }];
    
    vi.mocked(esiClientModule.fetchEsi).mockResolvedValueOnce({
      data: mockData,
      status: 'Green',
      cached: false
    });

    const response = await service.getSkillQueue('123', 'token');
    expect(response?.data).toEqual(mockData);
    expect(esiClientModule.fetchEsi).toHaveBeenCalledTimes(1);
  });

  it('should fail loudly on ZodError and log explicitly', async () => {
    const service = new LiveEsiService();
    const zodError = new z.ZodError([]);
    
    vi.mocked(esiClientModule.fetchEsi).mockRejectedValueOnce(zodError);

    await expect(service.getSkillQueue('123', 'token')).rejects.toThrow(z.ZodError);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ESI Worker: Contract Validation Error fetching skills'),
      zodError
    );
  });

  it('should fail loudly on TypeError (Network Error) and log explicitly', async () => {
    const service = new LiveEsiService();
    const typeError = new TypeError('Failed to fetch');
    
    vi.mocked(esiClientModule.fetchEsi).mockRejectedValueOnce(typeError);

    await expect(service.getSkillQueue('123', 'token')).rejects.toThrow(TypeError);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ESI Worker: Network Error fetching skills'),
      'Failed to fetch'
    );
  });

  it('should fail loudly on generic errors', async () => {
    const service = new LiveEsiService();
    const genericError = new Error('Generic failure');
    
    vi.mocked(esiClientModule.fetchEsi).mockRejectedValueOnce(genericError);

    await expect(service.getSkillQueue('123', 'token')).rejects.toThrow('Generic failure');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ESI Worker: Error fetching skills'),
      genericError
    );
  });
});
