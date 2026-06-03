import { z } from 'zod';

const MAX_SKILL_LEVEL = 5;
const MAX_PLANET_UPGRADE_LEVEL = 5;

const BaseSkillQueueSchema = z.object({
  queue_position: z.number().int().min(0),
  skill_id: z.number().int().positive(),
  finish_date: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(),
  level_start_sp: z.number().int().min(0),
  training_start_sp: z.number().int().min(0),
  level_end_sp: z.number().int().positive(),
  finished_level: z.number().int().min(1).max(MAX_SKILL_LEVEL)
}).strict();

export const EsiSkillQueueSchema = BaseSkillQueueSchema.refine(data => {
  // EVE Time-Space Continuum Rule
  if (data.start_date && data.finish_date) {
    if (new Date(data.start_date).getTime() >= new Date(data.finish_date).getTime()) {
      return false;
    }
  }
  // Level 1 Base SP Rule
  if (data.finished_level === 1 && data.level_start_sp !== 0) {
    return false;
  }
  // SP Growth Math (Strict Inequality)
  return data.level_start_sp <= data.training_start_sp && data.training_start_sp < data.level_end_sp;
}, {
  message: "Invalid EVE SP math or timeline"
});
export type EsiSkillQueue = z.infer<typeof EsiSkillQueueSchema>;

const ACTIVITY_MANUFACTURING = 1;
const ACTIVITY_TE_RESEARCH = 3;
const ACTIVITY_ME_RESEARCH = 4;
const ACTIVITY_COPYING = 5;
const ACTIVITY_INVENTION = 8;
const ACTIVITY_REACTIONS = 9;

export const EsiIndustryJobSchema = z.object({
  job_id: z.number().int().positive(),
  installer_id: z.number().int().positive(),
  facility_id: z.number().int().positive(),
  station_id: z.number().int().positive(),
  activity_id: z.union([
    z.literal(ACTIVITY_MANUFACTURING),
    z.literal(ACTIVITY_TE_RESEARCH),
    z.literal(ACTIVITY_ME_RESEARCH),
    z.literal(ACTIVITY_COPYING),
    z.literal(ACTIVITY_INVENTION),
    z.literal(ACTIVITY_REACTIONS)
  ]),
  blueprint_id: z.number().int().positive(),
  blueprint_type_id: z.number().int().positive(),
  blueprint_location_id: z.number().int().positive(),
  output_location_id: z.number().int().positive(),
  runs: z.number().int().positive(),
  cost: z.number().optional(),
  licensed_runs: z.number().int().optional(),
  probability: z.number().optional(),
  product_type_id: z.number().int().optional(),
  status: z.enum(['active', 'cancelled', 'delivered', 'paused', 'ready', 'reverted']),
  duration: z.number().int().positive(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  completed_date: z.string().datetime().optional(),
  completed_character_id: z.number().int().positive().optional(),
  successful_runs: z.number().int().optional()
}).strict();
export type EsiIndustryJob = z.infer<typeof EsiIndustryJobSchema>;

export const EsiPlanetSchema = z.object({
  planet_id: z.number().int().positive(),
  planet_type: z.enum(['temperate', 'barren', 'oceanic', 'ice', 'gas', 'lava', 'storm', 'plasma']),
  solar_system_id: z.number().int().positive(),
  owner_id: z.number().int().positive(),
  upgrade_level: z.number().int().min(0).max(MAX_PLANET_UPGRADE_LEVEL),
  num_pins: z.number().int().min(0),
  last_update: z.string().datetime()
}).strict();
export type EsiPlanet = z.infer<typeof EsiPlanetSchema>;

export const EsiPlanetLayoutSchema = z.object({
  pins: z.array(
    z.object({
      pin_id: z.number().int().positive(),
      type_id: z.number().int().positive(),
      expiry_time: z.string().datetime().optional(),
      contents: z.array(
        z.object({
          type_id: z.number().int().positive(),
          amount: z.number().int().min(0)
        }).strict()
      ).optional(),
    }).strict()
  )
}).strict();
export type EsiPlanetLayout = z.infer<typeof EsiPlanetLayoutSchema>;

export const EsiCharacterSkillsResponseSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.number().int().positive(),
      active_skill_level: z.number().int().min(0).max(MAX_SKILL_LEVEL),
      trained_skill_level: z.number().int().min(0).max(MAX_SKILL_LEVEL),
    }).strict()
  )
}).strict();
export type EsiCharacterSkillsResponse = z.infer<typeof EsiCharacterSkillsResponseSchema>;
