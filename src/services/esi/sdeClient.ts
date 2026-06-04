import { get, set } from 'idb-keyval';
import { z } from 'zod';
import { EsiSdeTypeSchema, EsiSdeSystemSchema, type EsiSdeType } from '../../schemas/esi';
import { logger } from '../../utils/logger';

export async function fetchSdeType(typeId: number): Promise<EsiSdeType> {
  const cacheKey = `sde_type_${typeId}`;
  
  // Check IndexedDB first
  const cachedData = await get<EsiSdeType>(cacheKey);
  if (cachedData) {
    return EsiSdeTypeSchema.parseAsync(cachedData);
  }

  // Fetch from ESI if not cached
  let response;
  try {
    // eslint-disable-next-line no-restricted-globals
    response = await fetch(`https://esi.evetech.net/latest/universe/types/${typeId}/`);
  } catch (error) {
    logger.error(`Network error fetching SDE type ${typeId}`, error);
    throw new Error(`Network error fetching SDE type ${typeId}: ${error}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch SDE type ${typeId}: ${response.statusText}`);
  }

  const rawData = await response.json();
  const result = await EsiSdeTypeSchema.parseAsync(rawData);

  // Permanently cache the result
  await set(cacheKey, result);

  return result;
}

export async function fetchSdeSystem(systemId: number): Promise<string> {
  const cacheKey = `sde_system_${systemId}`;
  
  // Check IndexedDB first
  const cachedData = await get<string>(cacheKey);
  if (cachedData) {
    return z.string().parseAsync(cachedData);
  }

  // Fetch from ESI if not cached
  let response;
  try {
    // eslint-disable-next-line no-restricted-globals
    response = await fetch(`https://esi.evetech.net/latest/universe/systems/${systemId}/`);
  } catch (error) {
    logger.error(`Network error fetching SDE system ${systemId}`, error);
    throw new Error(`Network error fetching SDE system ${systemId}: ${error}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch SDE system ${systemId}: ${response.statusText}`);
  }

  const rawData = await response.json();
  const data = await EsiSdeSystemSchema.parseAsync(rawData);
  const name = data.name;

  // Permanently cache the result
  await set(cacheKey, name);

  return name;
}
