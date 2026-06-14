import { EsiFetcher } from './EsiFetcher';
import { type EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiIndustryJobSchema, EsiPlanetSchema, EsiPlanetLayoutSchema, EsiIndustryJob, EsiPlanet, EsiPlanetLayout } from "../../../schemas/esi";
import type { IIndustryEsiService } from "../IEsiService";

export class LiveIndustryEsiService implements IIndustryEsiService {
    constructor(private fetcher: EsiFetcher) {
    }

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
