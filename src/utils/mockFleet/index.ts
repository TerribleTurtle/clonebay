import { MockCharacter } from './types';
import {
  defaultClones,
  defaultFatigue,
  defaultTransactions,
  defaultShip,
  defaultMail,
  defaultContracts
} from './defaults';
import {
  greenSkills,
  greenCharSkills,
  greenIndustry,
  greenPlanets,
  greenLayouts,
  redSkills,
  redLayouts,
  redIndustryCharSkills
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
    skills: greenSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: greenLayouts,
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts
  },
  {
    characterId: "90000002",
    characterName: "Alpha Red Queue",
    isk: 25000000,
    totalSp: 5000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    skills: redSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: greenLayouts,
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts
  },
  {
    characterId: "90000003",
    characterName: "PI Red",
    isk: 300000000,
    totalSp: 40000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    skills: greenSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: redLayouts,
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts
  },
  {
    characterId: "90000004",
    characterName: "Industry Red",
    isk: 8000000000,
    totalSp: 150000000,
    location: { solar_system_id: 30000142 },
    ship: defaultShip,
    skills: greenSkills,
    charSkills: redIndustryCharSkills,
    industry: greenIndustry, // 1 active job, but 6 slots available => RED
    planets: greenPlanets,
    planetLayouts: greenLayouts,
    clones: defaultClones,
    fatigue: defaultFatigue,
    transactions: defaultTransactions,
    mail: defaultMail,
    contracts: defaultContracts
  }
];
