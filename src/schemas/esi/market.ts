import { z } from 'zod';

export const EsiMarketOrderSchema = z.object({
  duration: z.number().int(),
  escrow: z.number().optional(),
  is_buy_order: z.boolean().optional(),
  is_corporation: z.boolean(),
  issued: z.string().datetime(),
  location_id: z.number().int(),
  min_volume: z.number().int().optional(),
  order_id: z.number().int(),
  price: z.number(),
  range: z.string(),
  region_id: z.number().int(),
  type_id: z.number().int(),
  volume_remain: z.number().int(),
  volume_total: z.number().int(),
}).strict();

export const EsiMarketOrdersArraySchema = z.array(EsiMarketOrderSchema);

export type EsiMarketOrder = z.infer<typeof EsiMarketOrderSchema>;
