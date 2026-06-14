
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { processSkills } from '../../src/workers/processors/skillsProcessor';
import { EsiSkillQueueSchema, type EsiSkillQueue } from '../../src/schemas/esi';
import type { EsiResponse } from '../../src/services/esi/esiClient';
import mockSkillQueueRaw from '../fixtures/mockSkillQueue.json';

describe('skillsProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNameCache: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    mockNameCache = { resolveIdsToNames: vi.fn().mockResolvedValue({}) };
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('should post Green status when queue has > 3 days remaining', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseQueue = EsiSkillQueueSchema.parse(mockSkillQueueRaw[0]);
    const mockQueue: EsiSkillQueue[] = [
      {
        ...baseQueue,
        start_date: new Date(now - 100000).toISOString(),
        finish_date: new Date(now + 3 * 24 * 60 * 60 * 1000 + 3600000).toISOString(), // > 3 days
      }
    ];
    const validQueue = z.array(EsiSkillQueueSchema).parse(mockQueue);

    await processSkills('char-1', { status: 'Green', cached: false, data: validQueue }, mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Green', data: validQueue, skillsContext: expect.any(Object) }
    });
  });

  it('should post Yellow status when queue has 1 to 3 days remaining', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseQueue = EsiSkillQueueSchema.parse(mockSkillQueueRaw[0]);
    const mockQueue: EsiSkillQueue[] = [
      {
        ...baseQueue,
        start_date: new Date(now - 100000).toISOString(),
        finish_date: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      }
    ];
    const validQueue = z.array(EsiSkillQueueSchema).parse(mockQueue);

    await processSkills('char-1', { status: 'Green', cached: false, data: validQueue }, mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Yellow', data: validQueue, skillsContext: expect.any(Object) }
    });
  });

  it('should post Red status when queue has < 24 hours remaining', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseQueue = EsiSkillQueueSchema.parse(mockSkillQueueRaw[0]);
    const mockQueue: EsiSkillQueue[] = [
      {
        ...baseQueue,
        start_date: new Date(now - 100000).toISOString(),
        finish_date: new Date(now + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
      }
    ];
    const validQueue = z.array(EsiSkillQueueSchema).parse(mockQueue);

    await processSkills('char-1', { status: 'Green', cached: false, data: validQueue }, mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Red', data: validQueue, skillsContext: expect.any(Object) }
    });
  });

  it('should explicitly test the Exact Zero Boundary for Red status', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const baseQueue = EsiSkillQueueSchema.parse(mockSkillQueueRaw[0]);
    const mockQueue: EsiSkillQueue[] = [
      {
        ...baseQueue,
        start_date: new Date(now - 100000).toISOString(),
        finish_date: new Date(now).toISOString(), // Exact Zero Boundary
      }
    ];
    const validQueue = z.array(EsiSkillQueueSchema).parse(mockQueue);

    await processSkills('char-1', { status: 'Green', cached: false, data: validQueue }, mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Red', data: validQueue, skillsContext: expect.any(Object) }
    });
  });

  it('should post Offline status when ESI is offline', async () => {
    await processSkills('char-1', { status: 'Offline', cached: false, data: null }, mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Offline', data: null }
    });
  });

  it('should post Red status when an error is thrown', async () => {
    // Explicitly throw an error to hit the outer catch block
    const badSkillsResult = { status: 'Green', cached: false };
    Object.defineProperty(badSkillsResult, 'data', {
      get: () => { throw new Error('Test error'); }
    });

    await expect(processSkills('char-1', badSkillsResult as unknown as EsiResponse<EsiSkillQueue[]>, mockNameCache, mockPostMessage)).rejects.toThrow();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'skills', status: 'Red', data: null }
    });
  });
});



