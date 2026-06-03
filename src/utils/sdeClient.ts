import { get, set } from 'idb-keyval';
import { EsiSdeTypeSchema, EsiSdeSystemSchema, type EsiSdeType } from '../schemas/esi';

export async function fetchSdeType(typeId: number): Promise<EsiSdeType> {
  const cacheKey = `sde_type_${typeId}`;
  
  // Check IndexedDB first
  const cachedData = await get<EsiSdeType>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from ESI if not cached
  const response = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SDE type ${typeId}: ${response.statusText}`);
  }

  const rawData = await response.json();
  const result = EsiSdeTypeSchema.parse(rawData);

  // Permanently cache the result
  await set(cacheKey, result);

  return result;
}

export async function fetchSdeSystem(systemId: number): Promise<string> {
  const cacheKey = `sde_system_${systemId}`;
  
  // Check IndexedDB first
  const cachedData = await get<string>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from ESI if not cached
  const response = await fetch(`https://esi.evetech.net/latest/universe/systems/${systemId}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SDE system ${systemId}: ${response.statusText}`);
  }

  const rawData = await response.json();
  const data = EsiSdeSystemSchema.parse(rawData);
  const name = data.name;

  // Permanently cache the result
  await set(cacheKey, name);

  return name;
}
