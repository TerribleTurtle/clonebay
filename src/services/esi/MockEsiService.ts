import type { IEsiService } from './IEsiService';
import type { EsiResponse } from '../../utils/esiClient';
import { mockFleet } from '../../utils/mockFleet';
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

export class MockEsiService implements IEsiService {
  private getMockChar(charId: string) {
    return mockFleet.find(c => c.characterId === charId);
  }

  private mockResponse<T>(data: any, schema: z.ZodType<T>): Promise<EsiResponse<T> | null> {
    if (!data) return Promise.resolve(null);
    return Promise.resolve({ data: schema.parse(data), status: 'Green', cached: false });
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
}
