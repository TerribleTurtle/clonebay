import { EsiMockFetcher } from './EsiMockFetcher';
import type { EsiResponse } from "../esiClient";
import { z } from "zod";
import { type EsiCorporationStructure } from "../../../schemas/esi/corporation";
import { EsiResolvedNameSchema, EsiResolvedName, EsiWarSchema, type EsiWar } from "../../../schemas/esi";
import type { IUniverseEsiService } from "../IEsiService";
import { MS_IN_HOUR, MOCK_CORP_ID_GOONSWARM, MOCK_WAR_ID, MOCK_WAR_STARTED_DELAY_HOURS, MOCK_WAR_DECLARED_DELAY_HOURS } from "../mockConstants";

export class MockUniverseEsiService implements IUniverseEsiService {
    constructor(private fetcher: EsiMockFetcher) {
    }

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
