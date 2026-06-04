import { DashboardStatus, YELLOW_THRESHOLD_PI_PERCENT, YELLOW_THRESHOLD_HOURS, MS_IN_HOUR } from './core';

export interface PiPinState {
  planetId: number;
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
 * @returns The status and associated alerts for the PI setup.
 */
export function calculatePiStatus(
  pins: PiPinState[],
  nowMs: number
): { status: DashboardStatus; alerts: { planetId: number; message: string }[] } {
  const alerts: { planetId: number; message: string }[] = [];

  if (!pins || pins.length === 0) {
    // If no PI is setup, default to Offline (Grey)
    return { status: 'Offline', alerts }; 
  }

  let status: DashboardStatus = 'Green';
  let hasActiveExtractor = false;
  let totalStorageUsed = 0;
  let hasStorage = false;

  for (const pin of pins) {
    if (pin.hasUnroutedMaterials) {
      alerts.push({ planetId: pin.planetId, message: 'Unrouted Materials' });
      status = 'Red';
    }

    if (pin.isStorage && pin.storageCapacity !== undefined && pin.storageUsed !== undefined) {
      hasStorage = true;
      totalStorageUsed += pin.storageUsed;
      if (pin.storageCapacity === 0 && pin.storageUsed > 0) {
        alerts.push({ planetId: pin.planetId, message: 'Storage Over Capacity' });
        status = 'Red';
      } else if (pin.storageCapacity > 0) {
        const fillRatio = pin.storageUsed / pin.storageCapacity;
        if (fillRatio >= 1.0) {
          alerts.push({ planetId: pin.planetId, message: 'Storage Full' });
          status = 'Red';
        } else if (fillRatio > YELLOW_THRESHOLD_PI_PERCENT) {
          alerts.push({ planetId: pin.planetId, message: 'Storage Almost Full' });
          if (status === 'Green') status = 'Yellow';
        }
      }
    }

    if (pin.isExtractor) {
      if (!pin.extractorExpiryTime) {
        alerts.push({ planetId: pin.planetId, message: 'Extractor Stopped' });
        status = 'Red';
      } else {
        const expiry = Date.parse(pin.extractorExpiryTime);
        if (expiry <= nowMs) {
          alerts.push({ planetId: pin.planetId, message: 'Extractor Cycle Finished' });
          status = 'Red';
        } else {
          hasActiveExtractor = true;
          const remainingMs = expiry - nowMs;
          if (remainingMs < YELLOW_THRESHOLD_HOURS * MS_IN_HOUR) {
            alerts.push({ planetId: pin.planetId, message: 'Extractor Cycle Ending Soon' });
            if (status === 'Green') status = 'Yellow';
          }
        }
      }
    }
  }

  // If there are no active extractors, AND they have storage but it's completely empty, the setup is totally dormant
  if (!hasActiveExtractor && hasStorage && totalStorageUsed === 0) {
    if (status !== 'Red') {
        status = 'Red';
    }
    // Assign dormant alert to the first planet, or unique planets that match this criteria? 
    // The previous logic evaluated this globally across all pins. Let's just attribute it to the first planet.
    alerts.push({ planetId: pins[0]?.planetId || 0, message: 'Dormant' });
  }

  return { status, alerts };
}

