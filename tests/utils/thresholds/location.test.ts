import { describe, it, expect } from 'vitest';
import { calculateLocationStatus } from '../../../src/utils/thresholds/location';

describe('calculateLocationStatus', () => {
  it('should return Yellow if both stationId and structureId are null/undefined (undocked)', () => {
    expect(calculateLocationStatus(null, null)).toBe('Yellow');
    expect(calculateLocationStatus(undefined, undefined)).toBe('Yellow');
  });

  it('should return Green if stationId is provided (docked)', () => {
    expect(calculateLocationStatus(60003760, null)).toBe('Green');
  });

  it('should return Green if structureId is provided (docked)', () => {
    expect(calculateLocationStatus(null, 1021348135816)).toBe('Green');
  });

  it('Exact Zero Boundary: should return Yellow if stationId is exactly 0 (invalid id treated as null)', () => {
    // The type is number | null. If it was 0, it evaluates as falsy in `if (stationId || structureId)`
    expect(calculateLocationStatus(0, null)).toBe('Yellow');
    expect(calculateLocationStatus(null, 0)).toBe('Yellow');
  });
});
