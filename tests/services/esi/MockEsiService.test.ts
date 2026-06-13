import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockEsiService } from '../../../src/services/esi/MockEsiService';
import { z } from 'zod';

describe('MockEsiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fail loudly when parseAsync rejects due to hallucinated mock data', async () => {
    const service = new MockEsiService();
    
    // Mock the internal data fetcher to return invalid structural data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(service as unknown, 'getMockChar').mockReturnValue({
      skills: [{
        skill_id: "hallucinated_string_instead_of_number", // Invalid type
        skillpoints_in_skill: 1000,
      }]
    });

    // MockEsiService must not swallow the error but reject the Promise loudly
    await expect(service.getSkillQueue('some_char_id')).rejects.toThrow(z.ZodError);
  });

  it('should successfully parse valid mock data using parseAsync', async () => {
    const service = new MockEsiService();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(service as unknown, 'getMockChar').mockReturnValue({
      skills: [{
        skill_id: 3327,
        queue_position: 0,
        level_start_sp: 0,
        training_start_sp: 0,
        level_end_sp: 250,
        finished_level: 1
      }]
    });

    const result = await service.getSkillQueue('some_char_id');
    expect(result).toBeDefined();
    expect(result!.status).toBe('Green');
    expect(result!.data).toEqual([{
      skill_id: 3327,
      queue_position: 0,
      level_start_sp: 0,
      training_start_sp: 0,
      level_end_sp: 250,
      finished_level: 1
    }]);
  });

  it('should return null when character lacks specific mock data', async () => {
    const service = new MockEsiService();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(service as unknown, 'getMockChar').mockReturnValue({
      skills: undefined // Missing data
    });

    const result = await service.getSkillQueue('some_char_id');
    expect(result).toBeNull();
  });
});

