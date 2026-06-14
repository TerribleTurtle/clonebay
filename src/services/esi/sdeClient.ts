import { get, set } from 'idb-keyval';
import { z } from 'zod';
import { EsiSdeTypeSchema, EsiSdeSystemSchema, type EsiSdeType } from '../../schemas/esi';
import { logger } from '../../utils/logger';
import { HttpClient } from '../../utils/http/httpClient';

const HTTP_STATUS_OK = 200;

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
    const client = new HttpClient();
    response = await client.request({
      url: `https://esi.evetech.net/latest/universe/types/${typeId}/`,
      method: 'GET',
      context: {}
    });
  } catch (error) {
    logger.error(`Network error fetching SDE type ${typeId}`, error);
    throw new Error(`Network error fetching SDE type ${typeId}: ${error}`);
  }
  if (response.status !== HTTP_STATUS_OK) {
    throw new Error(`Failed to fetch SDE type ${typeId}: HTTP ${response.status}`);
  }

  const result = await EsiSdeTypeSchema.parseAsync(response.data);

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
    const client = new HttpClient();
    response = await client.request({
      url: `https://esi.evetech.net/latest/universe/systems/${systemId}/`,
      method: 'GET',
      context: {}
    });
  } catch (error) {
    logger.error(`Network error fetching SDE system ${systemId}`, error);
    throw new Error(`Network error fetching SDE system ${systemId}: ${error}`);
  }
  if (response.status !== HTTP_STATUS_OK) {
    throw new Error(`Failed to fetch SDE system ${systemId}: HTTP ${response.status}`);
  }

  const data = await EsiSdeSystemSchema.parseAsync(response.data);
  const name = data.name;

  // Permanently cache the result
  await set(cacheKey, name);

  return name;
}
