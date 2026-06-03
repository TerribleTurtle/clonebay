import { z } from 'zod';

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
