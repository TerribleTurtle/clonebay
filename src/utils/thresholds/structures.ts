import type { EsiCorporationStructure } from '../../schemas/esi/corporation';
import type { StatusLight } from '../../store/useCharacterStore';

const HOURS_PER_DAY = 24;
const MINS_PER_HOUR = 60;
const SECS_PER_MIN = 60;
const MS_PER_SEC = 1000;
const MS_IN_DAY = HOURS_PER_DAY * MINS_PER_HOUR * SECS_PER_MIN * MS_PER_SEC;

const RED_DAYS_THRESHOLD = 3;
const YELLOW_DAYS_THRESHOLD = 7;

export function calculateStructureStatus(structure: EsiCorporationStructure, nowMs: number): StatusLight {
  const redStates = ['armor_reinforce', 'hull_reinforce', 'armor_vulnerable', 'hull_vulnerable'];
  
  if (redStates.includes(structure.state)) {
    return 'Red';
  }

  if (structure.fuel_expires) {
    const fuelTime = new Date(structure.fuel_expires).getTime();
    const diffMs = fuelTime - nowMs;
    
    if (diffMs < RED_DAYS_THRESHOLD * MS_IN_DAY) {
      return 'Red';
    }
  }

  if (structure.state === 'shield_vulnerable') {
    return 'Yellow';
  }

  if (structure.fuel_expires) {
    const fuelTime = new Date(structure.fuel_expires).getTime();
    const diffMs = fuelTime - nowMs;
    
    if (diffMs < YELLOW_DAYS_THRESHOLD * MS_IN_DAY) {
      return 'Yellow';
    }
  }

  return 'Green';
}
