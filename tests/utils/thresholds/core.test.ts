import { describe, it, expect } from 'vitest';
import { 
  SECONDS_PER_MINUTE, MINUTES_PER_HOUR, MS_PER_SECOND, 
  HOURS_IN_DAY, MS_IN_HOUR, MS_IN_DAY 
} from '../../../src/utils/thresholds/core';

describe('Core Constants Math Validation', () => {
  it('Exact Math Boundaries: should accurately define milliseconds in an hour', () => {
    expect(MS_IN_HOUR).toStrictEqual(60 * 60 * 1000);
    expect(MS_IN_HOUR).toStrictEqual(MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND);
  });

  it('Exact Math Boundaries: should accurately define milliseconds in a day', () => {
    expect(MS_IN_DAY).toStrictEqual(24 * 60 * 60 * 1000);
    expect(MS_IN_DAY).toStrictEqual(HOURS_IN_DAY * MS_IN_HOUR);
  });
});
