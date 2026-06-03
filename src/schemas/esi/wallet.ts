import { z } from 'zod';

export const EsiWalletSchema = z.number();
export type EsiWallet = z.infer<typeof EsiWalletSchema>;

export const EsiTransactionSchema = z.object({
  transaction_id: z.number().int().positive(),
  date: z.string().datetime(),
  client_id: z.number().int().positive(),
  location_id: z.number().int().positive(),
  type_id: z.number().int().positive(),
  unit_price: z.number(),
  quantity: z.number().int().positive(),
  is_buy: z.boolean(),
  is_personal: z.boolean(),
  journal_ref_id: z.number().int().positive()
}).strict();

export type EsiTransaction = z.infer<typeof EsiTransactionSchema>;
