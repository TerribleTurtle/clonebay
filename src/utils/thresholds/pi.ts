import { DashboardStatus, YELLOW_THRESHOLD_PI_PERCENT, YELLOW_THRESHOLD_HOURS, MS_IN_HOUR } from './core';

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
 *
 * @param pins - An array of PiPinState objects representing the character's PI pins.
 * @param nowMs - The current time in milliseconds since the UNIX epoch.
 * @returns The DashboardStatus ('Green', 'Yellow', or 'Red') for the PI status.
 */
export function calculatePiStatus(
  pins: PiPinState[],
  nowMs: number
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
      
      const expiry = Date.parse(pin.extractorExpiryTime);
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

