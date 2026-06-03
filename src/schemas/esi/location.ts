import { z } from 'zod';

export const EsiLocationSchema = z.object({
  solar_system_id: z.number().int().positive(),
  station_id: z.number().int().positive().optional(),
  structure_id: z.number().int().positive().optional()
}).strict();
export type EsiLocation = z.infer<typeof EsiLocationSchema>;

export const EsiShipSchema = z.object({
  ship_item_id: z.number().int().positive(),
  ship_name: z.string(),
  ship_type_id: z.number().int().positive()
}).strict();
export type EsiShip = z.infer<typeof EsiShipSchema>;
