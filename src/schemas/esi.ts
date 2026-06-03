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

export const EsiPlanetaryInteractionSchema = z.object({
  // Add PI fields here later as needed
}).passthrough();
