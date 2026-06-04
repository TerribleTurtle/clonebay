import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { processIndustry } from '../../src/workers/processors/industryProcessor';
import { EsiIndustryJobSchema, type EsiIndustryJob, EsiCharacterSkillsResponseSchema } from '../../src/schemas/esi';
import mockIndustryJobsRaw from '../fixtures/mockIndustryJobs.json';
import characterSkillsRaw from '../fixtures/character_skills.json';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue({}),
  set: vi.fn().mockResolvedValue(undefined)
}));

describe('industryProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEsiService: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    mockEsiService = {
      postUniverseNames: vi.fn().mockResolvedValue({ data: [] })
    };
    vi.useFakeTimers();
  });

  it('should post Green status when all jobs are running and > 12 hours remaining, and slots not empty', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseJob = EsiIndustryJobSchema.parse(mockIndustryJobsRaw[0]);
    const charSkills = EsiCharacterSkillsResponseSchema.parse(characterSkillsRaw);
    
    // The default charSkills has no mass production, so maxJobs = 1
    const mockJobs: EsiIndustryJob[] = [
      {
        ...baseJob,
        status: 'active',
        start_date: new Date(now - 100000).toISOString(),
        end_date: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // > 12 hours
      }
    ];

    const validJobs = z.array(EsiIndustryJobSchema).parse(mockJobs);

    await processIndustry('char-1', { status: 'Green', cached: false, data: validJobs }, { status: 'Green', cached: false, data: charSkills }, mockEsiService, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'industry', status: 'Green', data: validJobs })
    });
  });

  it('should post Yellow status when a job is finishing < 12 hours', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseJob = EsiIndustryJobSchema.parse(mockIndustryJobsRaw[0]);
    const charSkills = EsiCharacterSkillsResponseSchema.parse(characterSkillsRaw);

    const mockJobs: EsiIndustryJob[] = [
      {
        ...baseJob,
        status: 'active',
        start_date: new Date(now - 100000).toISOString(),
        end_date: new Date(now + 10 * 60 * 60 * 1000).toISOString(), // 10 hours
      }
    ];
    const validJobs = z.array(EsiIndustryJobSchema).parse(mockJobs);

    await processIndustry('char-1', { status: 'Green', cached: false, data: validJobs }, { status: 'Green', cached: false, data: charSkills }, mockEsiService, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'industry', status: 'Yellow', data: validJobs })
    });
  });

  it('should post Red status when an available slot is Empty', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const charSkills = EsiCharacterSkillsResponseSchema.parse(characterSkillsRaw);

    // 0 jobs but maxJobs is 1, so an available slot is Empty
    const mockJobs: EsiIndustryJob[] = [];
    const validJobs = z.array(EsiIndustryJobSchema).parse(mockJobs);

    await processIndustry('char-1', { status: 'Green', cached: false, data: validJobs }, { status: 'Green', cached: false, data: charSkills }, mockEsiService, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'industry', status: 'Red', data: validJobs })
    });
  });

  it('should post Red status when a job is ready to deliver (Exact Zero Boundary)', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseJob = EsiIndustryJobSchema.parse(mockIndustryJobsRaw[0]);
    const charSkills = EsiCharacterSkillsResponseSchema.parse(characterSkillsRaw);

    const mockJobs: EsiIndustryJob[] = [
      {
        ...baseJob,
        status: 'active', 
        start_date: new Date(now - 100000).toISOString(),
        end_date: new Date(now).toISOString(), // Exact Zero Boundary
      }
    ];
    const validJobs = z.array(EsiIndustryJobSchema).parse(mockJobs);

    await processIndustry('char-1', { status: 'Green', cached: false, data: validJobs }, { status: 'Green', cached: false, data: charSkills }, mockEsiService, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'industry', status: 'Red', data: validJobs })
    });
  });

  it('should post Offline status when ESI is offline', async () => {
    await processIndustry('char-1', { status: 'Offline', cached: false, data: null }, null, mockEsiService, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'industry', status: 'Offline', data: null })
    });
  });
});


