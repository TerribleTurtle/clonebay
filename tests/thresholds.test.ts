import { describe, it, expect } from 'vitest';
import {
  calculateSkillQueueStatus,
  calculatePiStatus,
  calculateIndustryStatus,
  SkillQueueItem,
  PiPinState,
  IndustryJobState,
  SECONDS_PER_MINUTE,
  MINUTES_PER_HOUR,
  MS_PER_SECOND,
  HOURS_IN_DAY,
  YELLOW_THRESHOLD_DAYS,
  YELLOW_THRESHOLD_HOURS
} from '../src/utils/thresholds';

const NOW = new Date('2026-01-01T12:00:00Z').getTime();
const HOURS_IN_MS = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
const DAYS_IN_MS = HOURS_IN_DAY * HOURS_IN_MS;
const MAX_TEST_JOBS = 2;
const RED_THRESHOLD_HOURS_MINUS_ONE = HOURS_IN_DAY - 1;
const YELLOW_THRESHOLD_HOURS_MINUS_ONE = YELLOW_THRESHOLD_HOURS - 1;

describe('Threshold Calculations', () => {
  describe('calculateSkillQueueStatus', () => {
    it('should return Red when queue is empty', () => {
      expect(calculateSkillQueueStatus([], NOW)).toBe('Red');
    });

    it('should return Red when items have no finish_date', () => {
      const queue: SkillQueueItem[] = [{}];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Red when max finish_date is <= now', () => {
      const queue: SkillQueueItem[] = [{ finish_date: new Date(NOW - MS_PER_SECOND).toISOString() }];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Red when remaining time is < 24 hours', () => {
      const queue: SkillQueueItem[] = [{ finish_date: new Date(NOW + RED_THRESHOLD_HOURS_MINUS_ONE * HOURS_IN_MS).toISOString() }];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Yellow when remaining time is exactly 24 hours', () => {
      const queue: SkillQueueItem[] = [{ finish_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Yellow');
    });

    it('should return Yellow when remaining time is 3 days', () => {
      const queue: SkillQueueItem[] = [{ finish_date: new Date(NOW + YELLOW_THRESHOLD_DAYS * DAYS_IN_MS).toISOString() }];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Yellow');
    });

    it('should return Green when remaining time is > 3 days', () => {
      const queue: SkillQueueItem[] = [{ finish_date: new Date(NOW + YELLOW_THRESHOLD_DAYS * DAYS_IN_MS + MS_PER_SECOND).toISOString() }];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Green');
    });
  });

  describe('calculatePiStatus', () => {
    it('should return Green when pins are empty', () => {
      expect(calculatePiStatus([], NOW)).toBe('Green');
    });

    it('should return Red when unrouted materials are present', () => {
      const pins: PiPinState[] = [{ isExtractor: false, isStorage: false, hasUnroutedMaterials: true }];
      expect(calculatePiStatus(pins, NOW)).toBe('Red');
    });

    it('should return Red when storage is 100% full', () => {
      const pins: PiPinState[] = [{
        isExtractor: false,
        isStorage: true,
        storageCapacity: 1000,
        storageUsed: 1000,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Red');
    });

    it('should return Yellow when storage is > 85% full', () => {
      const pins: PiPinState[] = [{
        isExtractor: false,
        isStorage: true,
        storageCapacity: 1000,
        storageUsed: 860, // 86%
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Yellow');
    });

    it('should return Green when storage is exactly 85% full', () => {
      const pins: PiPinState[] = [{
        isExtractor: false,
        isStorage: true,
        storageCapacity: 1000,
        storageUsed: 850, // 85%
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Green');
    });

    it('should return Red when extractor has no expiry time', () => {
      const pins: PiPinState[] = [{
        isExtractor: true,
        isStorage: false,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Red');
    });

    it('should return Red when extractor expiry is <= now', () => {
      const pins: PiPinState[] = [{
        isExtractor: true,
        extractorExpiryTime: new Date(NOW - MS_PER_SECOND).toISOString(),
        isStorage: false,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Red');
    });

    it('should return Yellow when extractor remaining time is < 12 hours', () => {
      const pins: PiPinState[] = [{
        isExtractor: true,
        extractorExpiryTime: new Date(NOW + YELLOW_THRESHOLD_HOURS_MINUS_ONE * HOURS_IN_MS).toISOString(),
        isStorage: false,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Yellow');
    });

    it('should return Green when extractor remaining time is >= 12 hours', () => {
      const pins: PiPinState[] = [{
        isExtractor: true,
        extractorExpiryTime: new Date(NOW + YELLOW_THRESHOLD_HOURS * HOURS_IN_MS).toISOString(),
        isStorage: false,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Green');
    });
  });

  describe('calculateIndustryStatus', () => {
    it('should return Red when running fewer jobs than max allowed', () => {
      const jobs: IndustryJobState[] = [{ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when a job is ready', () => {
      const jobs: IndustryJobState[] = [
        { status: 'ready' },
        { status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when a job is paused', () => {
      const jobs: IndustryJobState[] = [
        { status: 'paused' },
        { status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when an active job is finished (end_date <= now)', () => {
      const jobs: IndustryJobState[] = [
        { status: 'active', end_date: new Date(NOW - MS_PER_SECOND).toISOString() },
        { status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Yellow when the earliest job completes in < 12 hours', () => {
      const jobs: IndustryJobState[] = [
        { status: 'active', end_date: new Date(NOW + YELLOW_THRESHOLD_HOURS_MINUS_ONE * HOURS_IN_MS).toISOString() },
        { status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Yellow');
    });

    it('should return Green when all jobs complete in >= 12 hours', () => {
      const jobs: IndustryJobState[] = [
        { status: 'active', end_date: new Date(NOW + YELLOW_THRESHOLD_HOURS * HOURS_IN_MS).toISOString() },
        { status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() }
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Green');
    });
  });
});
