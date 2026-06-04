import { z } from 'zod';

export const EsiWarPartySchema = z.object({
  alliance_id: z.number().int().positive().optional(),
  corporation_id: z.number().int().positive().optional(),
  isk_destroyed: z.number().min(0),
  ships_killed: z.number().int().min(0)
}).strict();

export const EsiWarSchema = z.object({
  id: z.number().int().positive(),
  declared: z.string().datetime(),
  started: z.string().datetime().optional(),
  retracted: z.string().datetime().optional(),
  finished: z.string().datetime().optional(),
  mutual: z.boolean(),
  open_for_allies: z.boolean(),
  aggressor: EsiWarPartySchema,
  defender: EsiWarPartySchema,
  allies: z.array(z.object({
    alliance_id: z.number().int().positive().optional(),
    corporation_id: z.number().int().positive().optional()
  }).strict()).optional()
}).strict();

export type EsiWar = z.infer<typeof EsiWarSchema>;
