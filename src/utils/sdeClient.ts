import { get, set } from 'idb-keyval';

export interface SdeTypeData {
  capacity?: number;
  volume?: number;
  group_id?: number;
}

export async function fetchSdeType(typeId: number): Promise<SdeTypeData> {
  const cacheKey = `sde_type_${typeId}`;
  
  // Check IndexedDB first
  const cachedData = await get<SdeTypeData>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from ESI if not cached
  const response = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SDE type ${typeId}: ${response.statusText}`);
  }

  const data = await response.json();
  
  const result: SdeTypeData = {
    capacity: data.capacity,
    volume: data.volume,
    group_id: data.group_id,
  };

  // Permanently cache the result
  await set(cacheKey, result);

  return result;
}
