import { z } from 'zod';

export const EsiMailLabelsSchema = z.object({
  total_unread_count: z.number().int().min(0).optional(),
  labels: z.array(
    z.object({
      label_id: z.number().int().optional(),
      name: z.string().optional(),
      unread_count: z.number().int().min(0).optional(),
      color: z.string().optional()
    }).strict()
  ).optional()
}).strict();
export type EsiMailLabels = z.infer<typeof EsiMailLabelsSchema>;
