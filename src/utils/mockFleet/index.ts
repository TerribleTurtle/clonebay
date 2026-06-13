import { MockCharacter } from './types';
import {
  defaultClones,
  defaultFatigue,
  defaultTransactions,
  defaultShip,
  defaultMail,
  defaultContracts,
  defaultMarketOrders
} from './defaults';
import {
  getGreenSkills,
  getGreenCharSkills,
  getGreenIndustry,
  getGreenPlanets,
  getGreenLayouts,
  getRedSkills,
  getRedLayouts,
  getRedIndustryCharSkills
} from './states';

// Re-export type if consumers need it
export type { MockCharacter };

export const mockFleet: MockCharacter[] = [
  {
    characterId: "90000001",
    characterName: "Omega Green",
    isk: 1500000000,
    totalSp: 50000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    get skills() { return getGreenSkills(); },
    get charSkills() { return getGreenCharSkills(); },
    get industry() { return getGreenIndustry(); },
    get planets() { return getGreenPlanets(); },
    get planetLayouts() { return getGreenLayouts(); },
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts,
    marketOrders: defaultMarketOrders
  },
  {
    characterId: "90000002",
    characterName: "Alpha Red Queue",
    isk: 25000000,
    totalSp: 5000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    get skills() { return getRedSkills(); },
    get charSkills() { return getGreenCharSkills(); },
    get industry() { return getGreenIndustry(); },
    get planets() { return getGreenPlanets(); },
    get planetLayouts() { return getGreenLayouts(); },
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts,
    marketOrders: defaultMarketOrders
  },
  {
    characterId: "90000003",
    characterName: "PI Red",
    isk: 300000000,
    totalSp: 40000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    get skills() { return getGreenSkills(); },
    get charSkills() { return getGreenCharSkills(); },
    get industry() { return getGreenIndustry(); },
    get planets() { return getGreenPlanets(); },
    get planetLayouts() { return getRedLayouts(); },
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts,
    marketOrders: defaultMarketOrders
  },
  {
    characterId: "90000004",
    characterName: "Industry Red",
    isk: 8000000000,
    totalSp: 150000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    get skills() { return getGreenSkills(); },
    get charSkills() { return getRedIndustryCharSkills(); },
    get industry() { return getGreenIndustry(); }, // 1 active job, but 6 slots available => RED
    get planets() { return getGreenPlanets(); },
    get planetLayouts() { return getGreenLayouts(); },
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts,
    marketOrders: defaultMarketOrders
  }
];
