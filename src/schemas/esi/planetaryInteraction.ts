import { z } from 'zod';

const MAX_PLANET_UPGRADE_LEVEL = 5;

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
      extractor_details: z.record(z.string(), z.unknown()).optional(),
      install_time: z.string().optional(),
      last_cycle_start: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      schematic_id: z.number().int().optional(),
      factory_details: z.record(z.string(), z.unknown()).optional(),
      contents: z.array(
        z.object({
          type_id: z.number().int().positive(),
          amount: z.number().int().min(0)
        }).strict()
      ).optional(),
    }).strict()
  ),
  links: z.array(
    z.object({
      source_pin_id: z.number().int().positive(),
      destination_pin_id: z.number().int().positive(),
      link_level: z.number().int().min(0)
    }).strict()
  ).optional(),
  routes: z.array(
    z.object({
      route_id: z.number().int().positive(),
      source_pin_id: z.number().int().positive(),
      destination_pin_id: z.number().int().positive(),
      content_type_id: z.number().int().positive(),
      quantity: z.number().int().min(0),
      waypoints: z.array(z.number().int().positive()).optional()
    }).strict()
  ).optional()
}).strict();
export type EsiPlanetLayout = z.infer<typeof EsiPlanetLayoutSchema>;
