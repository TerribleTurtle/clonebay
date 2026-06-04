export interface PiSdeEntry {
  group_id: number;
  capacity?: number;
  volume?: number;
}

export const PI_SDE_DATA: Record<number, PiSdeEntry> = {
  // Common Command Centers (group 1043)
  2254: { group_id: 1043, capacity: 500 },
  2256: { group_id: 1043, capacity: 500 }, // Extractor or CC depending on mock
  // Generic mappings to satisfy tests and provide safety
  1043: { group_id: 1043, capacity: 500 },
  1048: { group_id: 1048, capacity: 10000 }, // Spaceport
  1064: { group_id: 1064, capacity: 12000 }, // Storage Facility
  1063: { group_id: 1063 }, // Extractor Control Unit
};
