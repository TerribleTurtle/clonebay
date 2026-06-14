import type { EsiResponse } from './esiClient';
import type { EsiPublicCharacter, EsiCharacterRoles } from '../../schemas/esi/character';
import type { EsiCorporationStructure } from '../../schemas/esi/corporation';
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
  EsiNotification,
  EsiWalletJournalEntry,
  EsiAttributes,
  EsiMailHeader,
  EsiResolvedName,
  EsiWar
} from '../../schemas/esi';

export interface ISkillsEsiService {
  getSkillQueue(charId: string, accessToken: string): Promise<EsiResponse<EsiSkillQueue[]> | null>;
  getCharacterSkills(charId: string, accessToken: string): Promise<EsiResponse<EsiCharacterSkillsResponse> | null>;
}

export interface IIndustryEsiService {
  getIndustryJobs(charId: string, accessToken: string): Promise<EsiResponse<EsiIndustryJob[]> | null>;
  getPlanets(charId: string, accessToken: string): Promise<EsiResponse<EsiPlanet[]> | null>;
  getPlanetLayout(charId: string, accessToken: string, planetId: number): Promise<EsiResponse<EsiPlanetLayout> | null>;
}

export interface IWalletEsiService {
  getWallet(charId: string, accessToken: string): Promise<EsiResponse<EsiWallet> | null>;
  getTransactions(charId: string, accessToken: string): Promise<EsiResponse<EsiTransaction[]> | null>;
  getWalletJournal(charId: string, accessToken: string): Promise<EsiResponse<EsiWalletJournalEntry[]> | null>;
  getMarketOrders(charId: string, accessToken: string): Promise<EsiResponse<EsiMarketOrder[]> | null>;
}

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

export interface IUniverseEsiService {
  getCorporationStructures(corpId: number, accessToken: string): Promise<EsiResponse<EsiCorporationStructure[]> | null>;
  resolveNames(ids: number[]): Promise<EsiResponse<EsiResolvedName[]> | null>;
  getWar(warId: number): Promise<EsiResponse<EsiWar> | null>;
}

export interface IEsiService {
  skills: ISkillsEsiService;
  industry: IIndustryEsiService;
  wallet: IWalletEsiService;
  character: ICharacterEsiService;
  universe: IUniverseEsiService;
}
