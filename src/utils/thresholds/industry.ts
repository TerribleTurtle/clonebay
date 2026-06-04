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
 * @returns The status and associated alerts for the industry jobs.
 */
export function calculateIndustryStatus(
  jobs: EsiIndustryJob[],
  maxJobs: number,
  nowMs: number
): { status: DashboardStatus; alerts: { facilityId?: number; stationId?: number; blueprintId: number; message: string }[] } {
  const alerts: { facilityId?: number; stationId?: number; blueprintId: number; message: string }[] = [];

  if (!jobs) {
    if (maxJobs > 0) {
      alerts.push({ blueprintId: 0, message: 'Empty Slot' });
    }
    return { status: maxJobs > 0 ? 'Red' : 'Green', alerts };
  }

  const relevantJobs = jobs.filter(
    (j) => j.status === 'active' || j.status === 'paused' || j.status === 'ready'
  );

  let status: DashboardStatus = 'Green';

  if (relevantJobs.length < maxJobs) {
    status = 'Red';
    const emptySlots = maxJobs - relevantJobs.length;
    for (let i = 0; i < emptySlots; i++) {
        alerts.push({ blueprintId: 0, message: 'Empty Slot' });
    }
  }

  let minTimeRemaining = Infinity;

  for (const job of relevantJobs) {
    const alertBase = {
      facilityId: job.facility_id,
      stationId: job.station_id,
      blueprintId: job.blueprint_type_id // Use type_id to resolve name
    };

    if (job.status === 'ready') {
      alerts.push({ ...alertBase, message: 'Job Finished' });
      status = 'Red';
    } else if (job.status === 'paused') {
      alerts.push({ ...alertBase, message: 'Job Paused' });
      status = 'Red';
    } else if (job.end_date) {
      const endTime = Date.parse(job.end_date);
      if (endTime <= nowMs) {
        alerts.push({ ...alertBase, message: 'Job Finished' });
        status = 'Red';
      } else {
        const remainingMs = endTime - nowMs;
        if (remainingMs < minTimeRemaining) {
          minTimeRemaining = remainingMs;
        }
        if (remainingMs < YELLOW_THRESHOLD_HOURS * MS_IN_HOUR) {
          alerts.push({ ...alertBase, message: 'Job Completing Soon' });
          if (status === 'Green') status = 'Yellow';
        }
      }
    }
  }

  return { status, alerts };
}
