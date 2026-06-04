import { DashboardStatus } from './core';

/**
 * Calculates the status of a character's mail.
 * - YELLOW: Unread mail > 0.
 * - GREEN: No unread mail.
 *
 * @param unreadCount - The number of unread mails, or null/undefined if unknown.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for mail.
 */
export function calculateMailStatus(unreadCount?: number | null): DashboardStatus {
  if (unreadCount === undefined || unreadCount === null) return 'Green';
  if (unreadCount > 0) return 'Yellow';
  return 'Green';
}

