import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockEsiService } from '../../../src/services/esi/MockEsiService';
import { z } from 'zod';

vi.mock('../../../src/utils/mockFleet', () => ({
  mockFleet: []
}));

import { mockFleet } from '../../../src/utils/mockFleet';
import type { MockCharacter } from '../../../src/utils/mockFleet/types';
import type { EsiSkillQueue } from '../../../src/schemas/esi';

const defaultMockCharacter: Omit<MockCharacter, 'characterId'> = {
  characterName: 'Test Character',
  isk: 1000000,
  totalSp: 5000000,
  location: { solar_system_id: 30000142 },
  ship: { ship_type_id: 603, ship_item_id: 123456, ship_name: 'Test Ship' },
  skills: [],
  charSkills: { skills: [], total_sp: 5000000, unallocated_sp: 0 },
  industry: [],
  planets: [],
  planetLayouts: {},
  clones: { home_location: { location_id: 60003760, location_type: 'station' }, jump_clones: [] },
  fatigue: { jump_fatigue_expire_date: '2025-01-01T00:00:00Z', last_jump_date: '2025-01-01T00:00:00Z', last_update_date: '2025-01-01T00:00:00Z' },
  transactions: [],
  mail: { labels: [], total_unread_count: 0 },
  contracts: [],
  marketOrders: []
};

describe('MockEsiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the array without reassigning the reference
    mockFleet.length = 0;
  });

  it('should fail loudly when parseAsync rejects due to hallucinated mock data', async () => {
    const service = new MockEsiService();
    
    // Push invalid data to mockFleet
    const badChar: MockCharacter = {
      ...defaultMockCharacter,
      characterId: 'some_char_id',
      skills: [{
        skill_id: 99999, // Some number, but missing other required fields like queue_position
      } as unknown as EsiSkillQueue]
    };
    mockFleet.push(badChar);

    // MockEsiService must not swallow the error but reject the Promise loudly
    await expect(service.getSkillQueue('some_char_id')).rejects.toThrow(z.ZodError);
  });

  it('should successfully parse valid mock data using parseAsync', async () => {
    const service = new MockEsiService();
    
    mockFleet.push({
      ...defaultMockCharacter,
      characterId: 'some_char_id',
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
    expect(result!.status).toStrictEqual('Green');
    expect(result!.data).toStrictEqual([{
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
    
    mockFleet.push({
      ...defaultMockCharacter,
      characterId: 'some_char_id',
      skills: undefined as unknown as EsiSkillQueue[]
    });

    const result = await service.getSkillQueue('some_char_id');
    expect(result).toBeNull();
  });
});
