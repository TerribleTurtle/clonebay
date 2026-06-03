import { logger } from './logger';

export const DOWNTIME_HOUR_UTC = 11;
export const DOWNTIME_DURATION_MINUTES = 15;
export const CRITICAL_ERROR_LIMIT = 20;
export const PAUSE_DURATION_SECONDS = 60;
export const MS_PER_SECOND = 1000;

let isGlobalPauseActive = false;
let pauseUntil = 0;
let clockDriftOffset = 0;

export function getAdjustedNow(): Date {
  return new Date(Date.now() + clockDriftOffset);
}

export function updateClockDrift(serverDateHeader: string | null): void {
  if (serverDateHeader) {
    const serverTime = new Date(serverDateHeader).getTime();
    const localTime = Date.now();
    clockDriftOffset = serverTime - localTime;
  }
}

export function checkDailyDowntime(): boolean {
  const now = getAdjustedNow();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();

  if (hours === DOWNTIME_HOUR_UTC && minutes >= 0 && minutes < DOWNTIME_DURATION_MINUTES) {
    return true;
  }
  return false;
}

export function checkAndApplyRateLimitError(errorLimitRemainHeader: string | null): void {
  if (errorLimitRemainHeader !== null) {
    const remain = parseInt(errorLimitRemainHeader, 10);
    if (!Number.isNaN(remain) && remain < CRITICAL_ERROR_LIMIT) {
      logger.error(`ESI error limit critically low: ${remain}. Pausing all requests for ${PAUSE_DURATION_SECONDS} seconds.`);
      isGlobalPauseActive = true;
      pauseUntil = getAdjustedNow().getTime() + PAUSE_DURATION_SECONDS * MS_PER_SECOND;
    }
  }
}

export function isPaused(): boolean {
  if (isGlobalPauseActive && getAdjustedNow().getTime() < pauseUntil) {
    return true;
  } else if (isGlobalPauseActive && getAdjustedNow().getTime() >= pauseUntil) {
    isGlobalPauseActive = false;
  }
  return false;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetGlobalPauseForTests(): void {
  isGlobalPauseActive = false;
  pauseUntil = 0;
  clockDriftOffset = 0;
}
