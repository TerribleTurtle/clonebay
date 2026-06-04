import { EsiIndustryJob } from '../../schemas/esi';
import { DashboardStatus, YELLOW_THRESHOLD_HOURS, MS_IN_HOUR } from './core';

/**
 * Calculates the status of a character's Industry Jobs.
 * - RED: Job is Finished (waiting for delivery) OR an available slot is Empty.
 * - YELLOW: Job completing < 12 hours.
 * - GREEN: All jobs running > 12 hours remaining.
 *
 * @param jobs - An array of EsiIndustryJob objects representing the character's industry jobs.
 * @param maxJobs - The maximum number of industry jobs the character can run.
 * @param nowMs - The current time in milliseconds since the UNIX epoch.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for the industry jobs.
 */
export function calculateIndustryStatus(
  jobs: EsiIndustryJob[],
  maxJobs: number,
  nowMs: number
): DashboardStatus {
  if (!jobs) {
    return maxJobs > 0 ? 'Red' : 'Green';
  }

  const relevantJobs = jobs.filter(
    (j) => j.status === 'active' || j.status === 'paused' || j.status === 'ready'
  );

  if (relevantJobs.length < maxJobs) {
    return 'Red';
  }

  let minTimeRemaining = Infinity;

  for (const job of relevantJobs) {
    if (job.status === 'ready' || job.status === 'paused') {
      return 'Red';
    }
    
    if (job.end_date) {
      const endTime = Date.parse(job.end_date);
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

