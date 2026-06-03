import { z } from 'zod';
import { 
  EsiSkillQueue, 
  EsiIndustryJob, 
  EsiPlanet, 
  EsiPlanetLayout, 
  EsiCharacterSkillsResponse,
  EsiSkillQueueSchema,
  EsiIndustryJobSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema,
  EsiCharacterSkillsResponseSchema
} from '../schemas/esi';

import mockSkillQueueRaw from '../../tests/fixtures/mockSkillQueue.json';
import mockIndustryJobsRaw from '../../tests/fixtures/mockIndustryJobs.json';
import mockPlanetsRaw from '../../tests/fixtures/mockPlanets.json';

// Clone helper to avoid mutating the imported raw JSON
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export interface MockCharacter {
  characterId: string;
  characterName: string;
  isk: number;
  totalSp: number;
  location: { solar_system_id: number };
  skills: EsiSkillQueue[];
  charSkills: EsiCharacterSkillsResponse;
  industry: EsiIndustryJob[];
  planets: EsiPlanet[];
  planetLayouts: Record<number, EsiPlanetLayout>;
}

const nowMs = Date.now();
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const MS_IN_SECOND = 1000;
const HOURS_IN_DAY = 24;

const msPerHour = MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MS_IN_SECOND;
const msPerDay = HOURS_IN_DAY * msPerHour;

const shiftDate = (dateStr: string, offsetMs: number) => {
  return new Date(new Date(dateStr).getTime() + offsetMs).toISOString();
};

// ==========================================
// 1. OMEGA ALL-GREEN
// ==========================================
const greenSkillQueue = z.array(EsiSkillQueueSchema).parse(clone(mockSkillQueueRaw));
const lastSkillFinish = new Date(greenSkillQueue[greenSkillQueue.length - 1]!.finish_date!).getTime();
const TEN_DAYS = 10;
const queueOffset = (nowMs + TEN_DAYS * msPerDay) - lastSkillFinish;
const greenSkills = greenSkillQueue.map(sq => ({
  ...sq,
  start_date: sq.start_date ? shiftDate(sq.start_date, queueOffset) : undefined,
  finish_date: sq.finish_date ? shiftDate(sq.finish_date, queueOffset) : undefined
}));
z.array(EsiSkillQueueSchema).parse(greenSkills);

const greenCharSkills: EsiCharacterSkillsResponse = {
  skills: [
    { skill_id: 3388, active_skill_level: 0, trained_skill_level: 0 },
    { skill_id: 24630, active_skill_level: 0, trained_skill_level: 0 }
  ],
  total_sp: 50000000
};
EsiCharacterSkillsResponseSchema.parse(greenCharSkills);

const baseIndustry = z.array(EsiIndustryJobSchema).parse(clone(mockIndustryJobsRaw));
const activeJob = baseIndustry.find(j => j.status === 'active')!;
const TWENTY_HOURS = 20;
const FIFTEEN_HOURS = 15;
const FIVE_HOURS = 5;
activeJob.end_date = new Date(nowMs + TWENTY_HOURS * msPerHour).toISOString();
activeJob.start_date = new Date(nowMs - FIVE_HOURS * msPerHour).toISOString();
const greenIndustry = [activeJob];
z.array(EsiIndustryJobSchema).parse(greenIndustry);

const greenPlanets = z.array(EsiPlanetSchema).parse(clone(mockPlanetsRaw));
z.array(EsiPlanetSchema).parse(greenPlanets);

const greenLayouts: Record<number, EsiPlanetLayout> = {
  [greenPlanets[0]!.planet_id]: {
    pins: [
      {
        pin_id: 1001,
        type_id: 2256, // Command Center
        contents: []
      },
      {
        pin_id: 1002,
        type_id: 2544, // Extractor
        expiry_time: new Date(nowMs + FIFTEEN_HOURS * msPerHour).toISOString(),
      }
    ]
  }
};
EsiPlanetLayoutSchema.parse(greenLayouts[greenPlanets[0]!.planet_id]);

// ==========================================
// 2. ALPHA RED QUEUE
// ==========================================
const redSkills: EsiSkillQueue[] = [];
z.array(EsiSkillQueueSchema).parse(redSkills);

// ==========================================
// 3. PI RED (Storage Full / Expired)
// ==========================================
const redLayouts: Record<number, EsiPlanetLayout> = {
  [greenPlanets[0]!.planet_id]: {
    pins: [
      {
        pin_id: 1002,
        type_id: 2544, // Extractor
        expiry_time: new Date(nowMs - FIVE_HOURS * msPerHour).toISOString(), // Expired
      }
    ]
  }
};
EsiPlanetLayoutSchema.parse(redLayouts[greenPlanets[0]!.planet_id]);

// ==========================================
// 4. INDUSTRY RED (Empty Slots)
// ==========================================
const redIndustryCharSkills: EsiCharacterSkillsResponse = {
  skills: [
    { skill_id: 3388, active_skill_level: 5, trained_skill_level: 5 }, // maxJobs = 6
    { skill_id: 24630, active_skill_level: 0, trained_skill_level: 0 }
  ],
  total_sp: 50000000
};

// ==========================================
// ASSEMBLE FLEET
// ==========================================
export const mockFleet: MockCharacter[] = [
  {
    characterId: "90000001",
    characterName: "Omega Green",
    isk: 1500000000,
    totalSp: 50000000,
    location: { solar_system_id: 30000142 },
    skills: greenSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: greenLayouts
  },
  {
    characterId: "90000002",
    characterName: "Alpha Red Queue",
    isk: 25000000,
    totalSp: 5000000,
    location: { solar_system_id: 30000142 },
    skills: redSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: greenLayouts
  },
  {
    characterId: "90000003",
    characterName: "PI Red",
    isk: 300000000,
    totalSp: 40000000,
    location: { solar_system_id: 30000142 },
    skills: greenSkills,
    charSkills: greenCharSkills,
    industry: greenIndustry,
    planets: greenPlanets,
    planetLayouts: redLayouts
  },
  {
    characterId: "90000004",
    characterName: "Industry Red",
    isk: 8000000000,
    totalSp: 150000000,
    location: { solar_system_id: 30000142 },
    skills: greenSkills,
    charSkills: redIndustryCharSkills,
    industry: greenIndustry, // 1 active job, but 6 slots available => RED
    planets: greenPlanets,
    planetLayouts: greenLayouts
  }
];
