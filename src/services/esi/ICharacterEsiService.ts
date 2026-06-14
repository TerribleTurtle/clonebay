import type { EsiResponse } from './esiClient';
import type { 
  EsiPublicCharacter, EsiCharacterRoles, EsiLocation, EsiShip, 
  EsiClones, EsiFatigue, EsiMailLabels, EsiContract, EsiNotification, 
  EsiAttributes, EsiMailHeader 
} from '../../schemas/esi';

export interface ICharacterEsiService {
  getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null>;
  getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null>;
  getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null>;
  getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null>;
  getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null>;
  getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null>;
  getCharacterNotifications(charId: string, accessToken: string): Promise<EsiResponse<EsiNotification[]> | null>;
  getPublicCharacterInfo(charId: string): Promise<EsiResponse<EsiPublicCharacter> | null>;
  getCharacterRoles(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterRoles> | null>;
  getAttributes(charId: string, accessToken: string): Promise<EsiResponse<EsiAttributes> | null>;
  getMail(charId: string, accessToken: string): Promise<EsiResponse<EsiMailHeader[]> | null>;
}
