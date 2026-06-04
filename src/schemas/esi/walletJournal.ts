import { z } from 'zod';

export const EsiWalletJournalEntrySchema = z.object({
  id: z.number().int(),
  date: z.string().datetime(),
  ref_type: z.string(),
  context_id: z.number().int().optional(),
  context_id_type: z.string().optional(),
  first_party_id: z.number().int().optional(),
  second_party_id: z.number().int().optional(),
  amount: z.number().optional(),
  balance: z.number().optional(),
  description: z.string(),
  reason: z.string().optional(),
  tax: z.number().optional(),
  tax_receiver_id: z.number().int().optional(),
}).strict();

export const EsiWalletJournalSchema = z.array(EsiWalletJournalEntrySchema);
export type EsiWalletJournalEntry = z.infer<typeof EsiWalletJournalEntrySchema>;
export type EsiWalletJournal = z.infer<typeof EsiWalletJournalSchema>;
