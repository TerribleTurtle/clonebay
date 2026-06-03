export type DashboardStatus = 'Green' | 'Yellow' | 'Red';

export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const MS_PER_SECOND = 1000;
export const HOURS_IN_DAY = 24;
export const YELLOW_THRESHOLD_DAYS = 3;
export const YELLOW_THRESHOLD_PI_PERCENT = 0.85;
export const YELLOW_THRESHOLD_HOURS = 12;
export const DEFAULT_WALLET_MIN_THRESHOLD = 100_000_000;
export const DEFAULT_CLONE_COOLDOWN_HOURS = 24;

const MS_IN_HOUR = MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
const MS_IN_DAY = HOURS_IN_DAY * MS_IN_HOUR;

import { EsiSkillQueue, EsiIndustryJob } from '../schemas/esi';

/**
 * Calculates the status of a character's skill queue.
 * - RED: Queue is empty OR < 24 hours remaining.
 * - YELLOW: Queue has 1 to 3 days remaining.
 * - GREEN: Queue has > 3 days remaining.
 */
export function calculateSkillQueueStatus(
  queue: EsiSkillQueue[],
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
      if (pin.storageCapacity === 0 && pin.storageUsed > 0) {
        return 'Red';
      } else if (pin.storageCapacity > 0) {
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



/**
 * Calculates the status of a character's Industry Jobs.
 * - RED: Job is Finished (waiting for delivery) OR an available slot is Empty.
 * - YELLOW: Job completing < 12 hours.
 * - GREEN: All jobs running > 12 hours remaining.
 */
export function calculateIndustryStatus(
  jobs: EsiIndustryJob[],
  maxJobs: number,
  nowMs: number = Date.now()
): DashboardStatus {
  if (!jobs) {
    return maxJobs > 0 ? 'Red' : 'Green';
  }

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

/**
 * Calculates the status of a character's wallet.
 * - RED: ISK is below the minimum threshold (default 100M).
 * - GREEN: ISK is above the threshold.
 */
export function calculateWalletStatus(
  isk?: number | null,
  minThreshold: number = DEFAULT_WALLET_MIN_THRESHOLD
): DashboardStatus {
  if (isk === undefined || isk === null) return 'Green'; // Default green if no data
  if (isk < minThreshold) return 'Red';
  return 'Green';
}

/**
 * Calculates the status of a character's mail.
 * - YELLOW: Unread mail > 0.
 * - GREEN: No unread mail.
 */
export function calculateMailStatus(unreadCount?: number | null): DashboardStatus {
  if (unreadCount === undefined || unreadCount === null) return 'Green';
  if (unreadCount > 0) return 'Yellow';
  return 'Green';
}

/**
 * Calculates the status of a character's jump clone cooldown.
 * - YELLOW: Cooldown is active (last jump < 24 hours ago).
 * - GREEN: Jump clone ready.
 */
export function calculateCloneStatus(
  lastJumpDate?: string | null,
  nowMs: number = Date.now()
): DashboardStatus {
  if (!lastJumpDate) return 'Green';
  
  const lastJumpTime = new Date(lastJumpDate).getTime();
  const cooldownMs = DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR; // Default 24h, can be reduced by skills
  
  if (nowMs < lastJumpTime + cooldownMs) {
    return 'Yellow';
  }
  
  return 'Green';
}

/**
 * Calculates the status of a character's location.
 * - YELLOW: Undocked (no station_id or structure_id).
 * - GREEN: Docked.
 */
export function calculateLocationStatus(
  stationId?: number | null,
  structureId?: number | null
): DashboardStatus {
  if (stationId || structureId) {
    return 'Green'; // Docked
  }
  return 'Yellow'; // Undocked
}

