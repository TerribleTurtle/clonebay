import { z } from 'zod';

const MAX_SKILL_LEVEL = 5;

export const EsiCharacterSkillsResponseSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.number().int().positive(),
      active_skill_level: z.number().int().min(0).max(MAX_SKILL_LEVEL),
      trained_skill_level: z.number().int().min(0).max(MAX_SKILL_LEVEL),
      skillpoints_in_skill: z.number().int().min(0).optional(),
    }).strict()
  ),
  total_sp: z.number().int().min(0).optional(),
  unallocated_sp: z.number().int().min(0).optional()
}).strict();
export type EsiCharacterSkillsResponse = z.infer<typeof EsiCharacterSkillsResponseSchema>;

export const EsiClonesSchema = z.object({
  home_location: z.object({
    location_id: z.number().int().positive(),
    location_type: z.enum(['station', 'structure']).optional()
  }).strict().optional(),
  jump_clones: z.array(
    z.object({
      jump_clone_id: z.number().int().positive(),
      location_id: z.number().int().positive(),
      location_type: z.enum(['station', 'structure']),
      implants: z.array(z.number().int().positive()),
      name: z.string().optional()
    }).strict()
  ),
  last_clone_jump_date: z.string().datetime().optional(),
  last_station_change_date: z.string().datetime().optional()
}).strict();
export type EsiClones = z.infer<typeof EsiClonesSchema>;

export const EsiFatigueSchema = z.object({
  jump_fatigue_expire_date: z.string().datetime().optional(),
  last_jump_date: z.string().datetime().optional(),
  last_update_date: z.string().datetime().optional()
}).strict();
export type EsiFatigue = z.infer<typeof EsiFatigueSchema>;
