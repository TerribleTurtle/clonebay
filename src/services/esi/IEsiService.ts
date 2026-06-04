import type { EsiResponse } from './esiClient';
import type {
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
  EsiMarketOrder,
  EsiNotification
} from '../../schemas/esi';

export interface IEsiService {
  getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null>;
  getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null>;
  getIndustryJobs(charId: string, accessToken: string): Promise<EsiResponse<EsiIndustryJob[]> | null>;
  getPlanets(charId: string, accessToken: string): Promise<EsiResponse<EsiPlanet[]> | null>;
  getPlanetLayout(charId: string, accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null>;
  getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null>;
  getLocation(charId: string, accessToken: string): Promise<EsiResponse<EsiLocation> | null>;
  getShip(charId: string, accessToken: string): Promise<EsiResponse<EsiShip> | null>;
  getClones(charId: string, accessToken: string): Promise<EsiResponse<EsiClones> | null>;
  getFatigue(charId: string, accessToken: string): Promise<EsiResponse<EsiFatigue> | null>;
  getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null>;
  getMailLabels(charId: string, accessToken: string): Promise<EsiResponse<EsiMailLabels> | null>;
  getContracts(charId: string, accessToken: string): Promise<EsiResponse<EsiContract[]> | null>;
  getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null>;
  getCharacterNotifications(charId: string, accessToken: string): Promise<EsiResponse<EsiNotification[]> | null>;
}
