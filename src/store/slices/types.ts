import type { EsiClones, EsiFatigue, EsiTransaction, EsiShip, EsiLocation, EsiMailLabels, EsiContract, EsiMarketOrder } from '../../schemas/esi';
import type { EsiCorporationStructure } from '../../schemas/esi/corporation';

export type StatusLight = 'Green' | 'Yellow' | 'Red' | 'Offline';

export const DEFAULT_OFFLINE_STATUS = {
  skills: 'Offline',
  industry: 'Offline',
  pi: 'Offline',
  walletStatus: 'Offline',
  mailStatus: 'Offline',
  cloneStatus: 'Offline',
  locationStatus: 'Offline',
  structureStatus: 'Offline',
  warStatus: 'Offline'
} as const;

export interface CharacterStatus {
  name?: string;
  isk?: number;
  totalSp?: number;
  unallocatedSp?: number;
  maxClones?: number;
  locationId?: number;
  locationName?: string;
  stationId?: number;
  stationName?: string;
  structureId?: number;
  structureName?: string;
  location?: EsiLocation;
  ship?: EsiShip;
  skills: StatusLight;
  industry: StatusLight;
  pi: StatusLight;
  walletStatus: StatusLight;
  mailStatus: StatusLight;
  cloneStatus: StatusLight;
  locationStatus: StatusLight;
  structureStatus: StatusLight;
  warStatus: StatusLight;
  structures?: EsiCorporationStructure[];
  clones?: EsiClones;
  fatigue?: EsiFatigue;
  transactions?: { count: number } | EsiTransaction[];
  mail?: EsiMailLabels;
  contracts?: { count: number } | EsiContract[];
  marketOrders?: { count: number } | EsiMarketOrder[];
  skillsContext?: { activeSkill: string; timeRemaining: number; queue: string[] };
  spContext?: { current: number; unallocated: number; ratePerHour: number };
  piContext?: { alerts: string[] };
  indyContext?: { alerts: string[] };
  clonesContext?: { locationName: string; implants: string[] }[];
  ordersContext?: { topOrders: string[] };
  mailContext?: { unreadSubjects: string[] };
  warContext?: { alerts: string[] };
}
