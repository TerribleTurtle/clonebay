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

export const EsiPublicCharacterSchema = z.object({
  alliance_id: z.number().int().positive().optional(),
  ancestry_id: z.number().int().positive().optional(),
  birthday: z.string().datetime(),
  bloodline_id: z.number().int().positive(),
  corporation_id: z.number().int().positive(),
  description: z.string().optional(),
  faction_id: z.number().int().positive().optional(),
  gender: z.string().optional(),
  name: z.string(),
  race_id: z.number().int().positive(),
  security_status: z.number().optional(),
  title: z.string().optional()
}).strict();
export type EsiPublicCharacter = z.infer<typeof EsiPublicCharacterSchema>;

export const EsiCharacterRolesSchema = z.object({
  roles: z.array(z.string()).optional(),
  roles_at_base: z.array(z.string()).optional(),
  roles_at_hq: z.array(z.string()).optional(),
  roles_at_other: z.array(z.string()).optional()
}).strict();
export type EsiCharacterRoles = z.infer<typeof EsiCharacterRolesSchema>;

export const EsiAttributesSchema = z.object({
  charisma: z.number().int().min(1),
  intelligence: z.number().int().min(1),
  memory: z.number().int().min(1),
  perception: z.number().int().min(1),
  willpower: z.number().int().min(1),
  bonus_remaps: z.number().int().min(0).optional(),
  last_remap_date: z.string().datetime().optional(),
  accrued_remap_cooldown_date: z.string().datetime().optional()
}).strict();
export type EsiAttributes = z.infer<typeof EsiAttributesSchema>;
