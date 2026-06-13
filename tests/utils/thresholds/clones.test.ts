import { describe, it, expect } from 'vitest';
import { calculateCloneStatus } from '../../../src/utils/thresholds/clones';
import { MS_IN_HOUR, DEFAULT_CLONE_COOLDOWN_HOURS } from '../../../src/utils/thresholds/core';
import characterClonesFixture from '../../fixtures/character_clones.json';

describe('calculateCloneStatus', () => {
  it('should return Green if lastJumpDate is null or undefined', () => {
    expect(calculateCloneStatus(null, Date.now())).toBe('Green');
    expect(calculateCloneStatus(undefined, Date.now())).toBe('Green');
  });

  it('should return Yellow if cooldown is active (nowMs < lastJumpTime + cooldown)', () => {
    const lastJumpDate = '2026-06-13T10:00:00Z';
    const lastJumpTime = Date.parse(lastJumpDate);
    const nowMs = lastJumpTime + (DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR) - 1000; // 1 second before cooldown ends
    
    expect(calculateCloneStatus(lastJumpDate, nowMs)).toBe('Yellow');
  });

  it('Exact Zero Boundary: should return Green when nowMs === lastJumpTime + cooldownMs', () => {
    const lastJumpDate = '2026-06-13T10:00:00Z';
    const lastJumpTime = Date.parse(lastJumpDate);
    const cooldownMs = DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR;
    const nowMs = lastJumpTime + cooldownMs; // Exact boundary
    
    expect(calculateCloneStatus(lastJumpDate, nowMs)).toBe('Green');
  });

  it('should return Green if cooldown has expired', () => {
    const lastJumpDate = '2026-06-13T10:00:00Z';
    const lastJumpTime = Date.parse(lastJumpDate);
    const nowMs = lastJumpTime + (DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR) + 1000;
    
    expect(calculateCloneStatus(lastJumpDate, nowMs)).toBe('Green');
  });

  it('should handle fully hydrated mock structure even though function takes primitive (Sanity Check)', () => {
    // Clone the fixture
    const cloneData = { ...characterClonesFixture, last_jump_date: '2026-06-13T10:00:00Z' };
    const lastJumpTime = Date.parse(cloneData.last_jump_date);
    const cooldownMs = DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR;
    
    expect(calculateCloneStatus(cloneData.last_jump_date, lastJumpTime + cooldownMs)).toBe('Green'); // Exact boundary
    expect(calculateCloneStatus(cloneData.last_jump_date, lastJumpTime + cooldownMs - 1)).toBe('Yellow');
  });
});
