import { z } from 'zod';

export const EsiContractSchema = z.object({
  contract_id: z.number().int().min(0),
  issuer_id: z.number().int().min(0),
  issuer_corporation_id: z.number().int().min(0),
  assignee_id: z.number().int().min(0).optional(),
  acceptor_id: z.number().int().min(0).optional(),
  start_location_id: z.number().int().min(0).optional(),
  end_location_id: z.number().int().min(0).optional(),
  type: z.enum(['unknown', 'item_exchange', 'auction', 'courier', 'loan']),
  status: z.enum(['outstanding', 'in_progress', 'finished_issuer', 'finished_contractor', 'finished', 'cancelled', 'rejected', 'failed', 'deleted', 'reversed']),
  title: z.string().optional(),
  for_corporation: z.boolean().optional(),
  availability: z.enum(['public', 'personal', 'corporation', 'alliance']),
  date_issued: z.string().datetime(),
  date_expired: z.string().datetime(),
  date_accepted: z.string().datetime().optional(),
  days_to_complete: z.number().int().min(0).optional(),
  date_completed: z.string().datetime().optional(),
  price: z.number().optional(),
  reward: z.number().optional(),
  collateral: z.number().optional(),
  buyout: z.number().optional(),
  volume: z.number().optional()
}).strict();
export type EsiContract = z.infer<typeof EsiContractSchema>;
