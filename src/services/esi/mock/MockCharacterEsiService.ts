import { EsiMockFetcher } from './EsiMockFetcher';
import type { EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiPublicCharacterSchema, EsiCharacterRolesSchema, type EsiPublicCharacter, type EsiCharacterRoles } from "../../../schemas/esi/character";
import { EsiLocationSchema, EsiShipSchema, EsiClonesSchema, EsiFatigueSchema, EsiMailLabelsSchema, EsiContractSchema, EsiNotificationSchema, EsiLocation, EsiShip, EsiClones, EsiFatigue, EsiMailLabels, EsiContract, EsiNotification, EsiAttributes, EsiMailHeader } from "../../../schemas/esi";
import type { ICharacterEsiService } from "../IEsiService";
import { MS_IN_HOUR, MOCK_NOTIFICATION_DELAY_HOURS } from "../mockConstants";

export class MockCharacterEsiService implements ICharacterEsiService {
    constructor(private fetcher: EsiMockFetcher) {
    }

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

    getPublicCharacterInfo(_charId: string): Promise<EsiResponse<EsiPublicCharacter> | null> {
        const mockChar = { corporation_id: 1000123, birthday: new Date().toISOString(), bloodline_id: 1, name: 'Mock Char', race_id: 1 };
        return this.fetcher.mockResponse(mockChar, EsiPublicCharacterSchema);
    }

    getCharacterRoles(_charId: string, _accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null> {
        const mockRoles = { roles: [], roles_at_hq: ['Director'], roles_at_base: [], roles_at_other: [] };
        return this.fetcher.mockResponse(mockRoles, EsiCharacterRolesSchema);
    }

    getAttributes(_charId: string, _accessToken: string): Promise<EsiResponse<EsiAttributes> | null> {
        return Promise.resolve(null);
    }

    getMail(_charId: string, _accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null> {
        return Promise.resolve(null);
    }
}
