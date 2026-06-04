import type { IEsiService } from './IEsiService';
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

export class MockEsiService implements IEsiService {
  private getMockChar(charId: string) {
    return mockFleet.find(c => c.characterId === charId);
  }

  private mockResponse<T>(data: unknown, schema: z.ZodType<T>): Promise<EsiResponse<T> | null> {
    if (!data) return Promise.resolve(null);
    return Promise.resolve().then(() => schema.parseAsync(data)).then(parsed => ({ data: parsed, status: 'Green' as const, cached: false }));
  }

  getSkillQueue(charId: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.skills, z.array(EsiSkillQueueSchema));
  }

  getCharacterSkills(charId: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
    return this.mockResponse(this.getMockChar(charId)?.charSkills, EsiCharacterSkillsResponseSchema);
  }

  getIndustryJobs(charId: string): Promise<EsiResponse<EsiIndustryJob[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.industry, z.array(EsiIndustryJobSchema));
  }

  getPlanets(charId: string): Promise<EsiResponse<EsiPlanet[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.planets, z.array(EsiPlanetSchema));
  }

  getPlanetLayout(charId: string, _accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null> {
    const mockChar = this.getMockChar(charId);
    if (mockChar && mockChar.planetLayouts[planetId]) {
      return this.mockResponse(mockChar.planetLayouts[planetId], EsiPlanetLayoutSchema);
    }
    return this.mockResponse({ pins: [] }, EsiPlanetLayoutSchema);
  }

  getWallet(charId: string): Promise<EsiResponse<EsiWallet> | null> {
    return this.mockResponse(this.getMockChar(charId)?.isk, EsiWalletSchema);
  }

  getLocation(charId: string): Promise<EsiResponse<EsiLocation> | null> {
    return this.mockResponse(this.getMockChar(charId)?.location, EsiLocationSchema);
  }

  getShip(charId: string): Promise<EsiResponse<EsiShip> | null> {
    return this.mockResponse(this.getMockChar(charId)?.ship, EsiShipSchema);
  }

  getClones(charId: string): Promise<EsiResponse<EsiClones> | null> {
    return this.mockResponse(this.getMockChar(charId)?.clones, EsiClonesSchema);
  }

  getFatigue(charId: string): Promise<EsiResponse<EsiFatigue> | null> {
    return this.mockResponse(this.getMockChar(charId)?.fatigue, EsiFatigueSchema);
  }

  getTransactions(charId: string): Promise<EsiResponse<EsiTransaction[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.transactions, z.array(EsiTransactionSchema));
  }

  getMailLabels(charId: string): Promise<EsiResponse<EsiMailLabels> | null> {
    return this.mockResponse(this.getMockChar(charId)?.mail, EsiMailLabelsSchema);
  }

  getContracts(charId: string): Promise<EsiResponse<EsiContract[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.contracts, z.array(EsiContractSchema));
  }

  getMarketOrders(charId: string): Promise<EsiResponse<EsiMarketOrder[]> | null> {
    return this.mockResponse(this.getMockChar(charId)?.marketOrders, EsiMarketOrdersArraySchema);
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
        // eslint-disable-next-line no-magic-numbers
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'StructureUnderAttack',
        is_read: true
      }
    ];
    return this.mockResponse(mockNotifications, z.array(EsiNotificationSchema));
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
        // eslint-disable-next-line no-magic-numbers
        date: new Date(Date.now() - 3600000).toISOString(),
        ref_type: 'ess_escrow_transfer',
        amount: 45000000.00,
        balance: 1000000000.00,
        description: 'ESS Payout',
        reason: 'Main Bank Payout'
      },
      {
        id: 100000003,
        // eslint-disable-next-line no-magic-numbers
        date: new Date(Date.now() - 7200000).toISOString(),
        ref_type: 'player_trading',
        amount: -5000000.00,
        balance: 955000000.00,
        description: 'Trade with player',
        first_party_id: 12345678,
        second_party_id: 87654321
      }
    ];
    return this.mockResponse(mockJournal, z.array(EsiWalletJournalEntrySchema));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPublicCharacterInfo(_charId: string): Promise<EsiResponse<EsiPublicCharacter> | null> {
    const mockChar = { corporation_id: 1000123 };
    return this.mockResponse(mockChar, EsiPublicCharacterSchema);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCharacterRoles(_charId: string, _accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null> {
    const mockRoles = { roles: [], roles_at_hq: ['Director'], roles_at_base: [], roles_at_other: [] };
    return this.mockResponse(mockRoles, EsiCharacterRolesSchema);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCorporationStructures(_corpId: number, _accessToken: string): Promise<EsiResponse<EsiCorporationStructure[]> | null> {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAttributes(_charId: string, _accessToken: string): Promise<EsiResponse<EsiAttributes> | null> {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMail(_charId: string, _accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null> {
    return Promise.resolve(null);
  }

  resolveNames(ids: number[]): Promise<EsiResponse<EsiResolvedName[]> | null> {
    // eslint-disable-next-line no-magic-numbers
    if (ids.includes(986665792)) return this.mockResponse([{ category: 'corporation', id: 986665792, name: 'Goonswarm Federation' }], z.array(EsiResolvedNameSchema));
    return Promise.resolve(null);
  }

  getWar(warId: number): Promise<EsiResponse<EsiWar> | null> {
    // eslint-disable-next-line no-magic-numbers
    if (warId === 1941) {
      // eslint-disable-next-line no-magic-numbers
      const mockWar: EsiWar = { id: 1941, declared: new Date(Date.now() - 48 * 3600000).toISOString(), started: new Date(Date.now() - 24 * 3600000).toISOString(), mutual: false, open_for_allies: false, aggressor: { corporation_id: 986665792, isk_destroyed: 0, ships_killed: 0 }, defender: { corporation_id: 1000123, isk_destroyed: 0, ships_killed: 0 } };
      return this.mockResponse(mockWar, EsiWarSchema);
    }
    return Promise.resolve(null);
  }
}
