import { describe, it, expect } from 'vitest';
import { PI_SDE_DATA } from '../../src/utils/piSdeData';

describe('PI_SDE_DATA', () => {
  it('should contain expected mappings for common PI structures', () => {
    // Command Center
    expect(PI_SDE_DATA[2256]).toBeDefined();
    expect(PI_SDE_DATA[2256]?.group_id).toBe(1043);
  });

  it('should have proper structure for entries', () => {
    for (const [idStr, entry] of Object.entries(PI_SDE_DATA)) {
      const id = parseInt(idStr, 10);
      expect(id).toBeGreaterThan(0);
      expect(entry).toHaveProperty('group_id');
      expect(typeof entry.group_id).toBe('number');
      if (entry.volume !== undefined) {
        expect(typeof entry.volume).toBe('number');
      }
      if (entry.capacity !== undefined) {
        expect(typeof entry.capacity).toBe('number');
      }
    }
  });
});
