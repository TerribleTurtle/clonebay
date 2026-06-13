import { z } from 'zod';
import {
  EsiPlanetLayout,
  EsiCharacterSkillsResponse,
  EsiSkillQueueSchema,
  EsiIndustryJobSchema,
  EsiPlanetSchema,
  EsiPlanetLayoutSchema,
  EsiCharacterSkillsResponseSchema
} from '../../schemas/esi';

import mockSkillQueueRaw from '../../../tests/fixtures/mockSkillQueue.json';
import mockIndustryJobsRaw from '../../../tests/fixtures/mockIndustryJobs.json';
import mockPlanetsRaw from '../../../tests/fixtures/mockPlanets.json';
import characterSkillsRaw from '../../../tests/fixtures/character_skills.json';
import characterPlanetRaw from '../../../tests/fixtures/character_planet.json';

import {
  clone,
  shiftDate,
  nowMs,
  msPerHour,
  msPerDay,
  TEN_DAYS,
  TWENTY_HOURS,
  FIFTEEN_HOURS,
  FIVE_HOURS
} from './constants';

const memoize = <T>(fn: () => T) => {
  let val: T | null = null;
  return () => {
    if (!val) val = fn();
    return val;
  };
};

// ==========================================
// 1. OMEGA ALL-GREEN
// ==========================================
export const getGreenSkills = memoize(() => {
  const greenSkillQueue = z.array(EsiSkillQueueSchema).parse(clone(mockSkillQueueRaw));
  const lastSkillFinish = new Date(greenSkillQueue[greenSkillQueue.length - 1]!.finish_date!).getTime();
  const queueOffset = (nowMs + TEN_DAYS * msPerDay) - lastSkillFinish;
  const greenSkills = greenSkillQueue.map(sq => ({
    ...sq,
    start_date: sq.start_date ? shiftDate(sq.start_date, queueOffset) : undefined,
    finish_date: sq.finish_date ? shiftDate(sq.finish_date, queueOffset) : undefined
  }));
  return z.array(EsiSkillQueueSchema).parse(greenSkills);
});

export const getGreenCharSkills = memoize(() => {
  const baseCharSkills = EsiCharacterSkillsResponseSchema.parse(clone(characterSkillsRaw));
  const greenCharSkills: EsiCharacterSkillsResponse = {
    ...baseCharSkills,
    skills: [
      ...baseCharSkills.skills,
      { skill_id: 3388, active_skill_level: 0, trained_skill_level: 0, skillpoints_in_skill: 0 },
      { skill_id: 24630, active_skill_level: 0, trained_skill_level: 0, skillpoints_in_skill: 0 }
    ]
  };
  return EsiCharacterSkillsResponseSchema.parse(greenCharSkills);
});

export const getGreenIndustry = memoize(() => {
  const baseIndustry = z.array(EsiIndustryJobSchema).parse(clone(mockIndustryJobsRaw));
  const activeJob = baseIndustry.find(j => j.status === 'active')!;
  activeJob.end_date = new Date(nowMs + TWENTY_HOURS * msPerHour).toISOString();
  activeJob.start_date = new Date(nowMs - FIVE_HOURS * msPerHour).toISOString();
  return z.array(EsiIndustryJobSchema).parse([activeJob]);
});

export const getGreenPlanets = memoize(() => {
  return z.array(EsiPlanetSchema).parse(clone(mockPlanetsRaw));
});

export const getGreenLayouts = memoize(() => {
  const greenPlanets = getGreenPlanets();
  const basePlanetLayout = EsiPlanetLayoutSchema.parse(clone(characterPlanetRaw));
  const greenLayouts: Record<number, EsiPlanetLayout> = {
    [greenPlanets[0]!.planet_id]: {
      ...basePlanetLayout,
      pins: [
        ...basePlanetLayout.pins,
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
  return greenLayouts;
});

// ==========================================
// 2. ALPHA RED QUEUE
// ==========================================
export const getRedSkills = memoize(() => {
  return z.array(EsiSkillQueueSchema).parse([]);
});

// ==========================================
// 3. PI RED (Storage Full / Expired)
// ==========================================
export const getRedLayouts = memoize(() => {
  const greenPlanets = getGreenPlanets();
  const basePlanetLayout = EsiPlanetLayoutSchema.parse(clone(characterPlanetRaw));
  const redLayouts: Record<number, EsiPlanetLayout> = {
    [greenPlanets[0]!.planet_id]: {
      ...basePlanetLayout,
      pins: [
        ...basePlanetLayout.pins,
        {
          pin_id: 1002,
          type_id: 2544, // Extractor
          expiry_time: new Date(nowMs - FIVE_HOURS * msPerHour).toISOString(), // Expired
        }
      ]
    }
  };
  EsiPlanetLayoutSchema.parse(redLayouts[greenPlanets[0]!.planet_id]);
  return redLayouts;
});

// ==========================================
// 4. INDUSTRY RED (Empty Slots)
// ==========================================
export const getRedIndustryCharSkills = memoize(() => {
  const baseCharSkills = EsiCharacterSkillsResponseSchema.parse(clone(characterSkillsRaw));
  const redIndustryCharSkills: EsiCharacterSkillsResponse = {
    ...baseCharSkills,
    skills: [
      ...baseCharSkills.skills,
      { skill_id: 3388, active_skill_level: 5, trained_skill_level: 5, skillpoints_in_skill: 1280000 }, // maxJobs = 6
      { skill_id: 24630, active_skill_level: 0, trained_skill_level: 0, skillpoints_in_skill: 0 }
    ]
  };
  return redIndustryCharSkills;
});
