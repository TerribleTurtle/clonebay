import type { IEsiService } from './IEsiService';
import { fetchEsi, type EsiResponse } from '../../utils/esiClient';
import { z } from 'zod';
import {
  EsiSkillQueueSchema,
  EsiIndustryJobSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema,
  EsiCharacterSkillsResponseSchema,
  EsiWalletSchema,
  EsiLocationSchema,
  EsiShipSchema,
  EsiClonesSchema,
  EsiFatigueSchema,
  EsiTransactionSchema,
  EsiMailLabelsSchema,
  EsiContractSchema,
  EsiMarketOrdersArraySchema,
  EsiSkillQueue,
  EsiIndustryJob,
  EsiPlanet,
  EsiPlanetLayout,
  EsiCharacterSkillsResponse,
  EsiWallet,
  EsiLocation,
  EsiShip,
  EsiClones,
  EsiFatigue,
  EsiTransaction,
  EsiMailLabels,
  EsiContract,
  EsiMarketOrder
} from '../../schemas/esi';
import { logger } from '../../utils/logger';

export class LiveEsiService implements IEsiService {
  private safeFetch<T>(url: string, accessToken: string, characterId: string, schema: z.ZodType<T>, name: string): Promise<EsiResponse<T> | null> {
    return fetchEsi({ url, accessToken, characterId, schema }).catch(error => {
      logger.error(`ESI Worker: Error fetching ${name} for ${characterId}`, error);
      return null;
    });
  }

  getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skillqueue/`, accessToken, charId, z.array(EsiSkillQueueSchema), 'skills');
  }

  getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skills/`, accessToken, charId, EsiCharacterSkillsResponseSchema, 'character skills');
  }

  getIndustryJobs(charId: string, accessToken: string): Promise<EsiResponse<EsiIndustryJob[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`, accessToken, charId, z.array(EsiIndustryJobSchema), 'industry jobs');
  }

  getPlanets(charId: string, accessToken: string): Promise<EsiResponse<EsiPlanet[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/`, accessToken, charId, z.array(EsiPlanetSchema), 'planets');
  }

  getPlanetLayout(charId: string, accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/${planetId}/`, accessToken, charId, EsiPlanetLayoutSchema, 'planet layout');
  }

  getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/`, accessToken, charId, EsiWalletSchema, 'wallet');
  }

  getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, accessToken, charId, EsiLocationSchema, 'location');
  }

  getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, accessToken, charId, EsiShipSchema, 'ship');
  }

  getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/clones/`, accessToken, charId, EsiClonesSchema, 'clones');
  }

  getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/fatigue/`, accessToken, charId, EsiFatigueSchema, 'fatigue');
  }

  getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/v1/characters/${charId}/wallet/transactions/`, accessToken, charId, z.array(EsiTransactionSchema), 'transactions');
  }

  getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/labels/`, accessToken, charId, EsiMailLabelsSchema, 'mail labels');
  }

  getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/contracts/`, accessToken, charId, z.array(EsiContractSchema), 'contracts');
  }

  getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
    return this.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/orders/`, accessToken, charId, EsiMarketOrdersArraySchema, 'market orders');
  }
}
