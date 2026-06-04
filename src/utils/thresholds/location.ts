import { DashboardStatus } from './core';

/**
 * Calculates the status of a character's location.
 * - YELLOW: Undocked (no station_id or structure_id).
 * - GREEN: Docked.
 *
 * @param stationId - The station ID the character is docked at, or null/undefined if undocked.
 * @param structureId - The structure ID the character is docked at, or null/undefined if undocked.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for character location.
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

