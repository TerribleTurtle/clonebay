import { EsiMockFetcher } from './EsiMockFetcher';
import type { EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiIndustryJobSchema, EsiPlanetSchema, EsiPlanetLayoutSchema, EsiIndustryJob, EsiPlanet, EsiPlanetLayout } from "../../../schemas/esi";
import type { IIndustryEsiService } from "../IEsiService";

export class MockIndustryEsiService implements IIndustryEsiService {
    constructor(private fetcher: EsiMockFetcher) {
    }

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
