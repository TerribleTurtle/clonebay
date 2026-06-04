import { DashboardStatus, DEFAULT_CLONE_COOLDOWN_HOURS, MS_IN_HOUR } from './core';

/**
 * Calculates the status of a character's jump clone cooldown.
 * - YELLOW: Cooldown is active (last jump < 24 hours ago).
 * - GREEN: Jump clone ready.
 *
 * @param lastJumpDate - An ISO-8601 string of the character's last jump date, or null/undefined if unknown.
 * @param nowMs - The current time in milliseconds since the UNIX epoch.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for jump clones.
 */
export function calculateCloneStatus(
  lastJumpDate: string | null | undefined,
  nowMs: number
): DashboardStatus {
  if (!lastJumpDate) return 'Green';
  
  const lastJumpTime = Date.parse(lastJumpDate);
  const cooldownMs = DEFAULT_CLONE_COOLDOWN_HOURS * MS_IN_HOUR;
  
  if (nowMs < lastJumpTime + cooldownMs) {
    return 'Yellow';
  }
  
  return 'Green';
}

