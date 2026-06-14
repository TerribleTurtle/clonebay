import { EsiFetcher } from './EsiFetcher';
import { type EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiCorporationStructureSchema, type EsiCorporationStructure } from "../../../schemas/esi/corporation";
import { EsiResolvedNameSchema, type EsiResolvedName, EsiWarSchema, type EsiWar } from "../../../schemas/esi";
import type { IUniverseEsiService } from "../IEsiService";

export class LiveUniverseEsiService implements IUniverseEsiService {
    constructor(private fetcher: EsiFetcher) {
    }

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
