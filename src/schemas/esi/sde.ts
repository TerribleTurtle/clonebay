import { z } from 'zod';

export const EsiSdeSystemSchema = z.object({
  constellation_id: z.number().int(),
  name: z.string(),
  planets: z.array(z.object({
    planet_id: z.number().int(),
    moons: z.array(z.number().int()).optional(),
    asteroid_belts: z.array(z.number().int()).optional()
  }).strict()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }).strict(),
  security_class: z.string().optional(),
  security_status: z.number(),
  star_id: z.number().int().optional(),
  stargates: z.array(z.number().int()).optional(),
  stations: z.array(z.number().int()).optional(),
  system_id: z.number().int()
}).strict();
export type EsiSdeSystem = z.infer<typeof EsiSdeSystemSchema>;

export const EsiSdeTypeSchema = z.object({
  capacity: z.number().optional(),
  description: z.string().optional(),
  dogma_attributes: z.array(z.object({
    attribute_id: z.number().int(),
    value: z.number()
  }).strict()).optional(),
  dogma_effects: z.array(z.object({
    effect_id: z.number().int(),
    is_default: z.boolean()
  }).strict()).optional(),
  graphic_id: z.number().int().optional(),
  group_id: z.number().int().optional(),
  icon_id: z.number().int().optional(),
  market_group_id: z.number().int().optional(),
  mass: z.number().optional(),
  name: z.string(),
  packaged_volume: z.number().optional(),
  portion_size: z.number().int().optional(),
  published: z.boolean(),
  radius: z.number().optional(),
  type_id: z.number().int(),
  volume: z.number().optional()
}).strict();
export type EsiSdeType = z.infer<typeof EsiSdeTypeSchema>;
