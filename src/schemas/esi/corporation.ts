import { z } from 'zod';

export const EsiCorporationStructureServiceSchema = z.object({
  name: z.string(),
  state: z.enum(['online', 'offline', 'cleanup']), // Typical ESI states, string is safer but enum is often used
}).strict();

const MAX_HOUR = 23;

export const EsiCorporationStructureSchema = z.object({
  corporation_id: z.number().int().positive(),
  fuel_expires: z.string().datetime().optional(),
  name: z.string().optional(),
  next_reinforce_apply: z.string().datetime().optional(),
  next_reinforce_hour: z.number().int().min(0).max(MAX_HOUR).optional(),
  profile_id: z.number().int().positive(),
  reinforce_hour: z.number().int().min(0).max(MAX_HOUR).optional(),
  services: z.array(EsiCorporationStructureServiceSchema).optional(),
  state: z.string(),
  state_timer_end: z.string().datetime().optional(),
  state_timer_start: z.string().datetime().optional(),
  structure_id: z.number().int().positive(),
  system_id: z.number().int().positive(),
  type_id: z.number().int().positive(),
  unanchors_at: z.string().datetime().optional(),
}).strict();

export const EsiCorporationStructuresSchema = z.array(EsiCorporationStructureSchema);

export type EsiCorporationStructureService = z.infer<typeof EsiCorporationStructureServiceSchema>;
export type EsiCorporationStructure = z.infer<typeof EsiCorporationStructureSchema>;
export type EsiCorporationStructures = z.infer<typeof EsiCorporationStructuresSchema>;
