import { EsiFetcher } from './EsiFetcher';
import { type EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiSkillQueueSchema, EsiCharacterSkillsResponseSchema, EsiSkillQueue, EsiCharacterSkillsResponse } from "../../../schemas/esi";
import type { ISkillsEsiService } from "../IEsiService";

export class LiveSkillsEsiService implements ISkillsEsiService {
    constructor(private fetcher: EsiFetcher) {
    }

    getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skillqueue/`, accessToken, charId, z.array(EsiSkillQueueSchema), 'skills');
    }

    getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/skills/`, accessToken, charId, EsiCharacterSkillsResponseSchema, 'character skills');
    }
}
