/* eslint-disable no-restricted-syntax, @typescript-eslint/no-explicit-any */
import { fetchEsi, type EsiResponse } from './esiClient';
import { z } from 'zod';
import {
  EsiPublicCharacterSchema,
  EsiCharacterRolesSchema,
  EsiAttributesSchema,
  type EsiPublicCharacter,
  type EsiCharacterRoles,
  type EsiAttributes
} from '../../schemas/esi/character';
import {
  EsiCorporationStructureSchema,
  type EsiCorporationStructure
} from '../../schemas/esi/corporation';
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
  EsiNotificationSchema,
  EsiWalletJournalEntrySchema,
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
  EsiMarketOrder,
  EsiNotification,
  EsiWalletJournalEntry,
  EsiMailHeaderSchema,
  type EsiMailHeader,
  EsiResolvedNameSchema,
  type EsiResolvedName,
  EsiWarSchema,
  type EsiWar
} from '../../schemas/esi';
import { logger } from '../../utils/logger';

import type { IEsiService, ISkillsEsiService, IIndustryEsiService, IWalletEsiService, ICharacterEsiService, IUniverseEsiService } from './IEsiService';

class EsiFetcher {
  public safeFetch<T>(url: string, accessToken: string, characterId: string, schema: z.ZodType<T>, name: string, method?: string, body?: unknown): Promise<EsiResponse<T> | null> {
    const fetchOptions: any = { url, accessToken, characterId, schema };
    if (method !== undefined) fetchOptions.method = method;
    if (body !== undefined) fetchOptions.body = body;

    return fetchEsi<T>(fetchOptions).catch(error => {
      if (error instanceof z.ZodError) {
        logger.error(`ESI Worker: Contract Validation Error fetching ${name} for ${characterId}`, error);
      } else if (error instanceof TypeError) {
        logger.error(`ESI Worker: Network Error fetching ${name} for ${characterId}`, error.message);
      } else {
        logger.error(`ESI Worker: Error fetching ${name} for ${characterId}`, error);
      }
      throw error;
    });
  }
}

export class LiveSkillsEsiService implements ISkillsEsiService {
  constructor(private fetcher: EsiFetcher) {}
  getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skillqueue/`, accessToken, charId, z.array(EsiSkillQueueSchema), 'skills');
  }
  getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skills/`, accessToken, charId, EsiCharacterSkillsResponseSchema, 'character skills');
  }
}

export class LiveIndustryEsiService implements IIndustryEsiService {
  constructor(private fetcher: EsiFetcher) {}
  getIndustryJobs(charId: string, accessToken: string): Promise<EsiResponse<EsiIndustryJob[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/industry/jobs/`, accessToken, charId, z.array(EsiIndustryJobSchema), 'industry jobs');
  }
  getPlanets(charId: string, accessToken: string): Promise<EsiResponse<EsiPlanet[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/`, accessToken, charId, z.array(EsiPlanetSchema), 'planets');
  }
  getPlanetLayout(charId: string, accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/planets/${planetId}/`, accessToken, charId, EsiPlanetLayoutSchema, 'planet layout');
  }
}

export class LiveWalletEsiService implements IWalletEsiService {
  constructor(private fetcher: EsiFetcher) {}
  getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/`, accessToken, charId, EsiWalletSchema, 'wallet');
  }
  getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/v1/characters/${charId}/wallet/transactions/`, accessToken, charId, z.array(EsiTransactionSchema), 'transactions');
  }
  getWalletJournal(charId: string, accessToken: string): Promise<EsiResponse<EsiWalletJournalEntry[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/wallet/journal/`, accessToken, charId, z.array(EsiWalletJournalEntrySchema), 'wallet journal');
  }
  getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/orders/`, accessToken, charId, EsiMarketOrdersArraySchema, 'market orders');
  }
}

export class LiveCharacterEsiService implements ICharacterEsiService {
  constructor(private fetcher: EsiFetcher) {}
  getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, accessToken, charId, EsiLocationSchema, 'location');
  }
  getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, accessToken, charId, EsiShipSchema, 'ship');
  }
  getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/clones/`, accessToken, charId, EsiClonesSchema, 'clones');
  }
  getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/fatigue/`, accessToken, charId, EsiFatigueSchema, 'fatigue');
  }
  getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/labels/`, accessToken, charId, EsiMailLabelsSchema, 'mail labels');
  }
  getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/contracts/`, accessToken, charId, z.array(EsiContractSchema), 'contracts');
  }
  getCharacterNotifications(charId: string, accessToken: string): Promise<EsiResponse<EsiNotification[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/notifications/`, accessToken, charId, z.array(EsiNotificationSchema), 'notifications');
  }
  getPublicCharacterInfo(charId: string): Promise<EsiResponse<EsiPublicCharacter> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/`, '', charId, EsiPublicCharacterSchema, 'public character info');
  }
  getCharacterRoles(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/roles/`, accessToken, charId, EsiCharacterRolesSchema, 'character roles');
  }
  getAttributes(charId: string, accessToken: string): Promise<EsiResponse<EsiAttributes> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/attributes/`, accessToken, charId, EsiAttributesSchema, 'attributes');
  }
  getMail(charId: string, accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/`, accessToken, charId, z.array(EsiMailHeaderSchema), 'mail');
  }
}

export class LiveUniverseEsiService implements IUniverseEsiService {
  constructor(private fetcher: EsiFetcher) {}
  getCorporationStructures(corpId: number, accessToken: string): Promise<EsiResponse<EsiCorporationStructure[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/corporations/${corpId}/structures/`, accessToken, corpId.toString(), z.array(EsiCorporationStructureSchema), 'corporation structures');
  }
  resolveNames(ids: number[]): Promise<EsiResponse<EsiResolvedName[]> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/universe/names/`, '', '', z.array(EsiResolvedNameSchema), 'resolved names', 'POST', ids);
  }
  getWar(warId: number): Promise<EsiResponse<EsiWar> | null> {
    return this.fetcher.safeFetch(`https://esi.evetech.net/latest/wars/${warId}/`, '', '', EsiWarSchema, 'war');
  }
}

export class LiveEsiService implements IEsiService {
  private fetcher = new EsiFetcher();
  public skills = new LiveSkillsEsiService(this.fetcher);
  public industry = new LiveIndustryEsiService(this.fetcher);
  public wallet = new LiveWalletEsiService(this.fetcher);
  public character = new LiveCharacterEsiService(this.fetcher);
  public universe = new LiveUniverseEsiService(this.fetcher);
}
