import { z } from 'zod';

export const EsiSkillQueueSchema = z.object({
  skill_id: z.number(),
  finish_date: z.string().optional(),
  start_date: z.string().optional(),
  queue_position: z.number()
}).passthrough();

export const EsiIndustryJobSchema = z.object({
  job_id: z.number(),
  status: z.string(),
  end_date: z.string()
}).passthrough();

export const EsiPlanetSchema = z.object({
  planet_id: z.number(),
  planet_type: z.string(),
  upgrade_level: z.number(),
  num_pins: z.number(),
  last_update: z.string(),
}).passthrough();

export const EsiPlanetLayoutSchema = z.object({
  pins: z.array(
    z.object({
      pin_id: z.number(),
      type_id: z.number(),
      expiry_time: z.string().optional(),
      contents: z.array(
        z.object({
          type_id: z.number(),
          amount: z.number()
        }).passthrough()
      ).optional(),
    }).passthrough()
  )
}).passthrough();

export const EsiCharacterSkillsResponseSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.number(),
      active_skill_level: z.number(),
    }).passthrough()
  )
}).passthrough();
