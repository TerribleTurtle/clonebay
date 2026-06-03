import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  EsiSkillQueueSchema,
  EsiIndustryJobSchema,
  EsiSkillQueue,
  EsiIndustryJob
} from '../src/schemas/esi';
import mockSkillQueueRaw from './fixtures/mockSkillQueue.json';
import mockIndustryJobsRaw from './fixtures/mockIndustryJobs.json';
import {
  calculateSkillQueueStatus,
  calculatePiStatus,
  calculateIndustryStatus,
  PiPinState,
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

// Force JSON fixtures through Zod to guarantee runtime type safety
const mockSkillQueue = z.array(EsiSkillQueueSchema).parse(mockSkillQueueRaw);
const mockIndustryJobs = z.array(EsiIndustryJobSchema).parse(mockIndustryJobsRaw);

// Helpers to create fully populated valid ESI objects to prevent Mock-Blindness
function createQueueItem(overrides: Partial<EsiSkillQueue> = {}): EsiSkillQueue {
  const base = mockSkillQueue[0];
  if (!base) throw new Error("CRITICAL: mockSkillQueue fixture is empty!");
  
  return {
    queue_position: overrides.queue_position ?? base.queue_position,
    skill_id: overrides.skill_id ?? base.skill_id,
    finish_date: 'finish_date' in overrides ? overrides.finish_date : base.finish_date,
    start_date: 'start_date' in overrides ? overrides.start_date : base.start_date,
    level_start_sp: overrides.level_start_sp ?? base.level_start_sp,
    training_start_sp: overrides.training_start_sp ?? base.training_start_sp,
    level_end_sp: overrides.level_end_sp ?? base.level_end_sp,
    finished_level: overrides.finished_level ?? base.finished_level,
  };
}

function createJob(overrides: Partial<EsiIndustryJob> = {}): EsiIndustryJob {
  const base = mockIndustryJobs[0];
  if (!base) throw new Error("CRITICAL: mockIndustryJobs fixture is empty!");
  
  return {
    job_id: overrides.job_id ?? base.job_id,
    installer_id: overrides.installer_id ?? base.installer_id,
    facility_id: overrides.facility_id ?? base.facility_id,
    station_id: overrides.station_id ?? base.station_id,
    activity_id: overrides.activity_id ?? base.activity_id,
    blueprint_id: overrides.blueprint_id ?? base.blueprint_id,
    blueprint_type_id: overrides.blueprint_type_id ?? base.blueprint_type_id,
    blueprint_location_id: overrides.blueprint_location_id ?? base.blueprint_location_id,
    output_location_id: overrides.output_location_id ?? base.output_location_id,
    runs: overrides.runs ?? base.runs,
    cost: 'cost' in overrides ? overrides.cost : base.cost,
    licensed_runs: 'licensed_runs' in overrides ? overrides.licensed_runs : base.licensed_runs,
    probability: 'probability' in overrides ? overrides.probability : base.probability,
    product_type_id: 'product_type_id' in overrides ? overrides.product_type_id : base.product_type_id,
    status: overrides.status ?? base.status,
    duration: overrides.duration ?? base.duration,
    start_date: 'start_date' in overrides ? overrides.start_date : base.start_date,
    end_date: overrides.end_date ?? base.end_date,
    completed_date: 'completed_date' in overrides ? overrides.completed_date : base.completed_date,
    completed_character_id: 'completed_character_id' in overrides ? overrides.completed_character_id : base.completed_character_id,
    successful_runs: 'successful_runs' in overrides ? overrides.successful_runs : base.successful_runs,
  };
}

describe('Threshold Calculations', () => {
  describe('calculateSkillQueueStatus', () => {
    it('should return Red when queue is empty', () => {
      expect(calculateSkillQueueStatus([], NOW)).toBe('Red');
    });

    it('should return Red when items have no finish_date', () => {
      // By omitting finish_date via undefined, we simulate paused queue
      const queue = [createQueueItem({ finish_date: undefined })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Red when max finish_date is <= now', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW - MS_PER_SECOND).toISOString() })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Red when finish_date exactly matches nowMs (Exact Zero Boundary)', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW).toISOString() })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Red when remaining time is < 24 hours', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW + RED_THRESHOLD_HOURS_MINUS_ONE * HOURS_IN_MS).toISOString() })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Red');
    });

    it('should return Yellow when remaining time is exactly 24 hours', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Yellow');
    });

    it('should return Yellow when remaining time is 3 days', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW + YELLOW_THRESHOLD_DAYS * DAYS_IN_MS).toISOString() })];
      expect(calculateSkillQueueStatus(queue, NOW)).toBe('Yellow');
    });

    it('should return Green when remaining time is > 3 days', () => {
      const queue = [createQueueItem({ finish_date: new Date(NOW + YELLOW_THRESHOLD_DAYS * DAYS_IN_MS + MS_PER_SECOND).toISOString() })];
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

    it('should return Red for Zero Capacity Blackhole (capacity 0, used > 0)', () => {
      const pins: PiPinState[] = [{
        isExtractor: false,
        isStorage: true,
        storageCapacity: 0,
        storageUsed: 500,
        hasUnroutedMaterials: false
      }];
      expect(calculatePiStatus(pins, NOW)).toBe('Red');
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

    it('should return Red when extractor expiry exactly matches nowMs (Exact Zero Boundary)', () => {
      const pins: PiPinState[] = [{
        isExtractor: true,
        extractorExpiryTime: new Date(NOW).toISOString(),
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
      const jobs = [createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when a job is ready', () => {
      const jobs = [
        createJob({ status: 'ready' }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when a job is paused', () => {
      const jobs = [
        createJob({ status: 'paused' }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when an active job is finished (end_date <= now)', () => {
      const jobs = [
        createJob({ status: 'active', end_date: new Date(NOW - MS_PER_SECOND).toISOString() }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Red when an active job end_date exactly matches nowMs (Exact Zero Boundary)', () => {
      const jobs = [
        createJob({ status: 'active', end_date: new Date(NOW).toISOString() }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Red');
    });

    it('should return Yellow when the earliest job completes in < 12 hours', () => {
      const jobs = [
        createJob({ status: 'active', end_date: new Date(NOW + YELLOW_THRESHOLD_HOURS_MINUS_ONE * HOURS_IN_MS).toISOString() }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Yellow');
    });

    it('should return Green when all jobs complete in >= 12 hours', () => {
      const jobs = [
        createJob({ status: 'active', end_date: new Date(NOW + YELLOW_THRESHOLD_HOURS * HOURS_IN_MS).toISOString() }),
        createJob({ status: 'active', end_date: new Date(NOW + HOURS_IN_DAY * HOURS_IN_MS).toISOString() })
      ];
      expect(calculateIndustryStatus(jobs, MAX_TEST_JOBS, NOW)).toBe('Green');
    });
  });
});
