export type DashboardStatus = 'Green' | 'Yellow' | 'Red';

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MS_PER_SECOND = 1000;
export const HOURS_IN_DAY = 24;
export const YELLOW_THRESHOLD_DAYS = 3;
export const YELLOW_THRESHOLD_PI_PERCENT = 0.85;
export const YELLOW_THRESHOLD_HOURS = 12;

const MS_IN_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
const MS_IN_DAY = HOURS_IN_DAY * MS_IN_HOUR;

export interface SkillQueueItem {
  finish_date?: string; // ISO 8601 string
}

/**
 * Calculates the status of a character's skill queue.
 * - RED: Queue is empty OR < 24 hours remaining.
 * - YELLOW: Queue has 1 to 3 days remaining.
 * - GREEN: Queue has > 3 days remaining.
 */
export function calculateSkillQueueStatus(
  queue: SkillQueueItem[],
  nowMs: number = Date.now()
): DashboardStatus {
  if (!queue || queue.length === 0) {
    return 'Red';
  }

  let latestFinishDate = 0;
  for (const item of queue) {
    if (item.finish_date) {
      const finishTime = new Date(item.finish_date).getTime();
      if (finishTime > latestFinishDate) {
        latestFinishDate = finishTime;
      }
    }
  }

  if (latestFinishDate === 0 || latestFinishDate <= nowMs) {
    return 'Red';
  }

  const remainingMs = latestFinishDate - nowMs;
  if (remainingMs < MS_IN_DAY) {
    return 'Red';
  }
  if (remainingMs <= YELLOW_THRESHOLD_DAYS * MS_IN_DAY) {
    return 'Yellow';
  }

  return 'Green';
}

export interface PiPinState {
  isExtractor: boolean;
  extractorExpiryTime?: string | null;
  isStorage: boolean;
  storageCapacity?: number;
  storageUsed?: number;
  hasUnroutedMaterials: boolean;
}

/**
 * Calculates the status of a character's Planetary Interaction (PI).
 * - RED: Extractors stopped, OR Storage 100% full, OR unrouted materials detected.
 * - YELLOW: Extractor cycle ending < 12 hours, OR Storage > 85% full.
 * - GREEN: Extractors active > 12 hours remaining, Storage nominal.
 */
export function calculatePiStatus(
  pins: PiPinState[],
  nowMs: number = Date.now()
): DashboardStatus {
  if (!pins || pins.length === 0) {
    // If no PI is setup, default to Green to avoid false alarms
    return 'Green'; 
  }

  let status: DashboardStatus = 'Green';

  for (const pin of pins) {
    if (pin.hasUnroutedMaterials) {
      return 'Red';
    }

    if (pin.isStorage && pin.storageCapacity !== undefined && pin.storageUsed !== undefined) {
      if (pin.storageCapacity > 0) {
        const fillRatio = pin.storageUsed / pin.storageCapacity;
        if (fillRatio >= 1.0) {
          return 'Red';
        }
        if (fillRatio > YELLOW_THRESHOLD_PI_PERCENT && status === 'Green') {
          status = 'Yellow';
        }
      }
    }

    if (pin.isExtractor) {
      if (!pin.extractorExpiryTime) {
        return 'Red'; // Extractor is stopped
      }
      
      const expiry = new Date(pin.extractorExpiryTime).getTime();
      if (expiry <= nowMs) {
        return 'Red'; // Extractor cycle finished
      }
      
      const remainingMs = expiry - nowMs;
      if (remainingMs < YELLOW_THRESHOLD_HOURS * MS_IN_HOUR && status === 'Green') {
        status = 'Yellow';
      }
    }
  }

  return status;
}

export interface IndustryJobState {
  status: string; // e.g. 'active', 'paused', 'ready'
  end_date?: string; // ISO 8601 string
}

/**
 * Calculates the status of a character's Industry Jobs.
 * - RED: Job is Finished (waiting for delivery) OR an available slot is Empty.
 * - YELLOW: Job completing < 12 hours.
 * - GREEN: All jobs running > 12 hours remaining.
 */
export function calculateIndustryStatus(
  jobs: IndustryJobState[],
  maxJobs: number,
  nowMs: number = Date.now()
): DashboardStatus {
  const relevantJobs = jobs.filter(
    (j) => j.status === 'active' || j.status === 'paused' || j.status === 'ready'
  );

  // If we are running fewer jobs than max allowed, an available slot is empty
  if (relevantJobs.length < maxJobs) {
    return 'Red';
  }

  let minTimeRemaining = Infinity;

  for (const job of relevantJobs) {
    if (job.status === 'ready' || job.status === 'paused') {
      return 'Red';
    }
    
    if (job.end_date) {
      const endTime = new Date(job.end_date).getTime();
      if (endTime <= nowMs) {
        return 'Red';
      }
      
      const remainingMs = endTime - nowMs;
      if (remainingMs < minTimeRemaining) {
        minTimeRemaining = remainingMs;
      }
    }
  }

  if (minTimeRemaining < YELLOW_THRESHOLD_HOURS * MS_IN_HOUR) {
    return 'Yellow';
  }

  return 'Green';
}
