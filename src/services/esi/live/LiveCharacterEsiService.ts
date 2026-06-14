import { EsiFetcher } from './EsiFetcher';
import { type EsiResponse } from "../esiClient";
import { z } from "zod";
import { EsiPublicCharacterSchema, EsiCharacterRolesSchema, EsiAttributesSchema, type EsiPublicCharacter, type EsiCharacterRoles, type EsiAttributes } from "../../../schemas/esi/character";
import { EsiLocationSchema, EsiShipSchema, EsiClonesSchema, EsiFatigueSchema, EsiMailLabelsSchema, EsiContractSchema, EsiNotificationSchema, EsiLocation, EsiShip, EsiClones, EsiFatigue, EsiMailLabels, EsiContract, EsiNotification, EsiMailHeaderSchema, type EsiMailHeader } from "../../../schemas/esi";
import type { ICharacterEsiService } from "../IEsiService";

export class LiveCharacterEsiService implements ICharacterEsiService {
    constructor(private fetcher: EsiFetcher) {
    }

    getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/location/`, accessToken, charId, EsiLocationSchema, 'location');
    }

    getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/ship/`, accessToken, charId, EsiShipSchema, 'ship');
    }

    getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/clones/`, accessToken, charId, EsiClonesSchema, 'clones');
    }

    getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/fatigue/`, accessToken, charId, EsiFatigueSchema, 'fatigue');
    }

    getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/labels/`, accessToken, charId, EsiMailLabelsSchema, 'mail labels');
    }

    getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/contracts/`, accessToken, charId, z.array(EsiContractSchema), 'contracts');
    }

    getCharacterNotifications(charId: string, accessToken: string): Promise<EsiResponse<EsiNotification[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/notifications/`, accessToken, charId, z.array(EsiNotificationSchema), 'notifications');
    }

    getPublicCharacterInfo(charId: string): Promise<EsiResponse<EsiPublicCharacter> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/`, '', charId, EsiPublicCharacterSchema, 'public character info');
    }

    getCharacterRoles(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/roles/`, accessToken, charId, EsiCharacterRolesSchema, 'character roles');
    }

    getAttributes(charId: string, accessToken: string): Promise<EsiResponse<EsiAttributes> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/attributes/`, accessToken, charId, EsiAttributesSchema, 'attributes');
    }

    getMail(charId: string, accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null> {
        return this.fetcher.safeFetch(`https://esi.evetech.net/latest/characters/${charId}/mail/`, accessToken, charId, z.array(EsiMailHeaderSchema), 'mail');
    }
}
