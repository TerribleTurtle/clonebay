import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStructureStatus } from '../src/utils/thresholds/structures';
import type { EsiCorporationStructure } from '../src/schemas/esi/corporation';
import mockStructures from './fixtures/mockCorporationStructures.json';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

describe('calculateStructureStatus', () => {
  const baseStructure: EsiCorporationStructure = mockStructures[0] as EsiCorporationStructure;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Red for vulnerable/reinforced states regardless of fuel', () => {
    const nowMs = Date.now();
    const states = ['armor_reinforce', 'hull_reinforce', 'armor_vulnerable', 'hull_vulnerable'];
    
    states.forEach(state => {
      const structure = { ...baseStructure, state, fuel_expires: new Date(nowMs + 10 * MS_IN_DAY).toISOString() };
      expect(calculateStructureStatus(structure, nowMs)).toBe('Red');
    });
  });

  it('returns Red when fuel_expires is strictly less than 3 days', () => {
    const nowMs = Date.now();
    
    // 2.99 days
    const fuelExpires = new Date(nowMs + 2.99 * MS_IN_DAY).toISOString();
    const structure = { ...baseStructure, state: 'online', fuel_expires: fuelExpires };
    
    expect(calculateStructureStatus(structure, nowMs)).toBe('Red');
  });

  it('returns Red when fuel_expires is exactly 0 boundary', () => {
    const nowMs = Date.now();
    
    // Exactly now
    const fuelExpires = new Date(nowMs).toISOString();
    const structure = { ...baseStructure, state: 'online', fuel_expires: fuelExpires };
    
    expect(calculateStructureStatus(structure, nowMs)).toBe('Red');
  });

  it('returns Yellow for shield_vulnerable state with good fuel', () => {
    const nowMs = Date.now();
    const structure = { ...baseStructure, state: 'shield_vulnerable', fuel_expires: new Date(nowMs + 10 * MS_IN_DAY).toISOString() };
    
    expect(calculateStructureStatus(structure, nowMs)).toBe('Yellow');
  });

  it('returns Yellow when fuel_expires is between 3 and 7 days', () => {
    const nowMs = Date.now();
    
    // 3 days + 1ms should be Yellow
    const fuelExpires = new Date(nowMs + 3 * MS_IN_DAY + 1).toISOString();
    const structure = { ...baseStructure, state: 'online', fuel_expires: fuelExpires };
    
    expect(calculateStructureStatus(structure, nowMs)).toBe('Yellow');

    // 6.99 days
    const fuelExpiresUpper = new Date(nowMs + 6.99 * MS_IN_DAY).toISOString();
    const structureUpper = { ...baseStructure, state: 'online', fuel_expires: fuelExpiresUpper };
    
    expect(calculateStructureStatus(structureUpper, nowMs)).toBe('Yellow');
  });

  it('returns Green when fuel_expires is 7 days or more and state is online', () => {
    const nowMs = Date.now();
    
    // exactly 7 days
    const fuelExpires = new Date(nowMs + 7 * MS_IN_DAY).toISOString();
    const structure = { ...baseStructure, state: 'online', fuel_expires: fuelExpires };
    
    expect(calculateStructureStatus(structure, nowMs)).toBe('Green');

    // 10 days
    const fuelExpiresMore = new Date(nowMs + 10 * MS_IN_DAY).toISOString();
    const structureMore = { ...baseStructure, state: 'online', fuel_expires: fuelExpiresMore };
    
    expect(calculateStructureStatus(structureMore, nowMs)).toBe('Green');
  });

  it('returns Green when no fuel is required (no fuel_expires) and state is safe', () => {
    const nowMs = Date.now();
    const structure = { ...baseStructure, state: 'online', fuel_expires: undefined };
    expect(calculateStructureStatus(structure, nowMs)).toBe('Green');
  });
});
