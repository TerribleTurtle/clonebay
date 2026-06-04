import { z } from 'zod';

export const EsiResolvedNameSchema = z.object({
  category: z.enum([
    'alliance',
    'character',
    'constellation',
    'corporation',
    'inventory_type',
    'region',
    'solar_system',
    'station',
    'faction'
  ]),
  id: z.number().int().positive(),
  name: z.string()
}).strict();

export type EsiResolvedName = z.infer<typeof EsiResolvedNameSchema>;
