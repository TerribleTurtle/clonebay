import { EsiSkillQueue } from '../../schemas/esi';
import { DashboardStatus, MS_IN_DAY, YELLOW_THRESHOLD_DAYS } from './core';

/**
 * Calculates the status of a character's skill queue.
 * - RED: Queue is empty OR < 24 hours remaining.
 * - YELLOW: Queue has 1 to 3 days remaining.
 * - GREEN: Queue has > 3 days remaining.
 *
 * @param queue - An array of EsiSkillQueue objects representing the character's skill training queue.
 * @param nowMs - The current time in milliseconds since the UNIX epoch.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for the skill queue.
 */
export function calculateSkillQueueStatus(
  queue: EsiSkillQueue[],
  nowMs: number
): DashboardStatus {
  if (!queue || queue.length === 0) {
    return 'Red';
  }

  let latestFinishDate = 0;
  for (const item of queue) {
    if (item.finish_date) {
      const finishTime = Date.parse(item.finish_date);
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

