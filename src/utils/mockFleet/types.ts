import { 
  EsiSkillQueue, 
  EsiIndustryJob, 
  EsiPlanet, 
  EsiPlanetLayout, 
  EsiCharacterSkillsResponse,
  EsiClones,
  EsiFatigue,
  EsiTransaction,
  EsiShip,
  EsiMailLabels,
  EsiContract,
  EsiMarketOrder
} from '../../schemas/esi';

export interface MockCharacter {
  characterId: string;
  characterName: string;
  isk: number;
  totalSp: number;
  location: { solar_system_id: number };
  ship: EsiShip;
  skills: EsiSkillQueue[];
  charSkills: EsiCharacterSkillsResponse;
  industry: EsiIndustryJob[];
  planets: EsiPlanet[];
  planetLayouts: Record<number, EsiPlanetLayout>;
  clones: EsiClones;
  fatigue: EsiFatigue;
  transactions: EsiTransaction[];
  mail: EsiMailLabels;
  contracts: EsiContract[];
  marketOrders: EsiMarketOrder[];
}
