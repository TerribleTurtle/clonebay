import type { EsiResponse } from './esiClient';
import { mockFleet } from '../../utils/mockFleet';
import { z } from 'zod';

import {
  EsiPublicCharacterSchema,
  EsiCharacterRolesSchema,
  type EsiPublicCharacter,
  type EsiCharacterRoles
} from '../../schemas/esi/character';
import {
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
  EsiAttributes,
  EsiMailHeader,
  EsiResolvedNameSchema,
  EsiResolvedName,
  EsiWarSchema,
  type EsiWar
} from '../../schemas/esi';

import type { IEsiService, ISkillsEsiService, IIndustryEsiService, IWalletEsiService, ICharacterEsiService, IUniverseEsiService } from './IEsiService';
import { MS_IN_HOUR, MOCK_CORP_ID_GOONSWARM, MOCK_WAR_ID, MOCK_NOTIFICATION_DELAY_HOURS, MOCK_JOURNAL_DELAY_HOURS_1, MOCK_JOURNAL_DELAY_HOURS_2, MOCK_WAR_STARTED_DELAY_HOURS, MOCK_WAR_DECLARED_DELAY_HOURS } from './mockConstants';

class EsiMockFetcher {
  public getMockChar(charId: string) {
    return mockFleet.find(c => c.characterId === charId);
  }

  public mockResponse<T>(data: unknown, schema: z.ZodType<T>): Promise<EsiResponse<T> | null> {
    if (!data) return Promise.resolve(null);
    return Promise.resolve().then(() => schema.parseAsync(data)).then(parsed => ({ data: parsed, status: 'Green' as const, cached: false }));
  }

}

export class MockSkillsEsiService implements ISkillsEsiService {
  constructor(private fetcher: EsiMockFetcher) {}
  getSkillQueue(charId: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.skills, z.array(EsiSkillQueueSchema));
  }
  getCharacterSkills(charId: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.charSkills, EsiCharacterSkillsResponseSchema);
  }
}

export class MockIndustryEsiService implements IIndustryEsiService {
  constructor(private fetcher: EsiMockFetcher) {}
  getIndustryJobs(charId: string): Promise<EsiResponse<EsiIndustryJob[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.industry, z.array(EsiIndustryJobSchema));
  }
  getPlanets(charId: string): Promise<EsiResponse<EsiPlanet[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.planets, z.array(EsiPlanetSchema));
  }
  getPlanetLayout(charId: string, _accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null> {
    const mockChar = this.fetcher.getMockChar(charId);
    if (mockChar && mockChar.planetLayouts[planetId]) {
      return this.fetcher.mockResponse(mockChar.planetLayouts[planetId], EsiPlanetLayoutSchema);
    }
    return this.fetcher.mockResponse({ pins: [] }, EsiPlanetLayoutSchema);
  }
}

export class MockWalletEsiService implements IWalletEsiService {
  constructor(private fetcher: EsiMockFetcher) {}
  getWallet(charId: string): Promise<EsiResponse<EsiWallet> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.isk, EsiWalletSchema);
  }
  getTransactions(charId: string): Promise<EsiResponse<EsiTransaction[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.transactions, z.array(EsiTransactionSchema));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getWalletJournal(_charId: string): Promise<EsiResponse<EsiWalletJournalEntry[]> | null> {
    const mockJournal: EsiWalletJournalEntry[] = [
      {
        id: 100000001,
        date: new Date().toISOString(),
        ref_type: 'bounty_prizes',
        amount: 15000000.50,
        balance: 1015000000.50,
        description: 'Bounty prizes',
        reason: '15000000.50 ISK bounty payout',
        tax: 500000.0,
        tax_receiver_id: 1000123
      },
      {
        id: 100000002,
        date: new Date(Date.now() - MOCK_JOURNAL_DELAY_HOURS_1 * MS_IN_HOUR).toISOString(),
        ref_type: 'ess_escrow_transfer',
        amount: 45000000.00,
        balance: 1000000000.00,
        description: 'ESS Payout',
        reason: 'Main Bank Payout'
      },
      {
        id: 100000003,
        date: new Date(Date.now() - MOCK_JOURNAL_DELAY_HOURS_2 * MS_IN_HOUR).toISOString(),
        ref_type: 'player_trading',
        amount: -5000000.00,
        balance: 955000000.00,
        description: 'Trade with player',
        first_party_id: 12345678,
        second_party_id: 87654321
      }
    ];
    return this.fetcher.mockResponse(mockJournal, z.array(EsiWalletJournalEntrySchema));
  }
  getMarketOrders(charId: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.marketOrders, EsiMarketOrdersArraySchema);
  }
}

export class MockCharacterEsiService implements ICharacterEsiService {
  constructor(private fetcher: EsiMockFetcher) {}
  getLocation(charId: string): Promise<EsiResponse<EsiLocation> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.location, EsiLocationSchema);
  }
  getShip(charId: string): Promise<EsiResponse<EsiShip> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.ship, EsiShipSchema);
  }
  getClones(charId: string): Promise<EsiResponse<EsiClones> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.clones, EsiClonesSchema);
  }
  getFatigue(charId: string): Promise<EsiResponse<EsiFatigue> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.fatigue, EsiFatigueSchema);
  }
  getMailLabels(charId: string): Promise<EsiResponse<EsiMailLabels> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.mail, EsiMailLabelsSchema);
  }
  getContracts(charId: string): Promise<EsiResponse<EsiContract[]> | null> {
    return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.contracts, z.array(EsiContractSchema));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCharacterNotifications(_charId: string): Promise<EsiResponse<EsiNotification[]> | null> {
    const mockNotifications = [
      {
        notification_id: 100000001,
        sender_id: 1000123,
        sender_type: 'character',
        text: 'againstID: 1000123\ncost: 0\ndeclaredByID: 986665792\ndelayHours: 24\nhostileState: 0\nwarID: 1941\n',
        timestamp: new Date().toISOString(),
        type: 'WarDeclared',
        is_read: false
      },
      {
        notification_id: 100000002,
        sender_id: 1000124,
        sender_type: 'corporation',
        text: 'Structure under attack!',
        timestamp: new Date(Date.now() - MOCK_NOTIFICATION_DELAY_HOURS * MS_IN_HOUR).toISOString(),
        type: 'StructureUnderAttack',
        is_read: true
      }
    ];
    return this.fetcher.mockResponse(mockNotifications, z.array(EsiNotificationSchema));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPublicCharacterInfo(_charId: string): Promise<EsiResponse<EsiPublicCharacter> | null> {
    const mockChar = { corporation_id: 1000123 };
    return this.fetcher.mockResponse(mockChar, EsiPublicCharacterSchema);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCharacterRoles(_charId: string, _accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null> {
    const mockRoles = { roles: [], roles_at_hq: ['Director'], roles_at_base: [], roles_at_other: [] };
    return this.fetcher.mockResponse(mockRoles, EsiCharacterRolesSchema);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAttributes(_charId: string, _accessToken: string): Promise<EsiResponse<EsiAttributes> | null> {
    return Promise.resolve(null);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMail(_charId: string, _accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null> {
    return Promise.resolve(null);
  }
}

export class MockUniverseEsiService implements IUniverseEsiService {
  constructor(private fetcher: EsiMockFetcher) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCorporationStructures(_corpId: number, _accessToken: string): Promise<EsiResponse<EsiCorporationStructure[]> | null> {
    return Promise.resolve(null);
  }
  resolveNames(ids: number[]): Promise<EsiResponse<EsiResolvedName[]> | null> {
    if (ids.includes(MOCK_CORP_ID_GOONSWARM)) return this.fetcher.mockResponse([{ category: 'corporation', id: MOCK_CORP_ID_GOONSWARM, name: 'Goonswarm Federation' }], z.array(EsiResolvedNameSchema));
    return Promise.resolve(null);
  }
  getWar(warId: number): Promise<EsiResponse<EsiWar> | null> {
    if (warId === MOCK_WAR_ID) {
      const mockWar: EsiWar = { id: MOCK_WAR_ID, declared: new Date(Date.now() - MOCK_WAR_DECLARED_DELAY_HOURS * MS_IN_HOUR).toISOString(), started: new Date(Date.now() - MOCK_WAR_STARTED_DELAY_HOURS * MS_IN_HOUR).toISOString(), mutual: false, open_for_allies: false, aggressor: { corporation_id: MOCK_CORP_ID_GOONSWARM, isk_destroyed: 0, ships_killed: 0 }, defender: { corporation_id: 1000123, isk_destroyed: 0, ships_killed: 0 } };
      return this.fetcher.mockResponse(mockWar, EsiWarSchema);
    }
    return Promise.resolve(null);
  }
}

export class MockEsiService implements IEsiService {
  private fetcher = new EsiMockFetcher();
  public skills = new MockSkillsEsiService(this.fetcher);
  public industry = new MockIndustryEsiService(this.fetcher);
  public wallet = new MockWalletEsiService(this.fetcher);
  public character = new MockCharacterEsiService(this.fetcher);
  public universe = new MockUniverseEsiService(this.fetcher);
}
