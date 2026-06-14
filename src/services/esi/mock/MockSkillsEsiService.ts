import { EsiMockFetcher } from './EsiMockFetcher';
import type { EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiSkillQueueSchema, EsiCharacterSkillsResponseSchema, EsiSkillQueue, EsiCharacterSkillsResponse } from "../../../schemas/esi";
import type { ISkillsEsiService } from "../IEsiService";

export class MockSkillsEsiService implements ISkillsEsiService {
    constructor(private fetcher: EsiMockFetcher) {
    }

    getSkillQueue(charId: string): Promise<EsiResponse<EsiSkillQueue[]> | null> {
        return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.skills, z.array(EsiSkillQueueSchema));
    }

    getCharacterSkills(charId: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null> {
        return this.fetcher.mockResponse(this.fetcher.getMockChar(charId)?.charSkills, EsiCharacterSkillsResponseSchema);
    }
}
