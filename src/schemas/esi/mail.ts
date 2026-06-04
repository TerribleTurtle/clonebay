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

export const EsiMailHeaderSchema = z.object({
  mail_id: z.number().int().positive(),
  subject: z.string().optional(),
  from: z.number().int().optional(),
  timestamp: z.string().datetime().optional(),
  is_read: z.boolean().optional(),
  labels: z.array(z.number().int()).optional(),
  recipients: z.array(
    z.object({
      recipient_id: z.number().int(),
      recipient_type: z.enum(['alliance', 'character', 'corporation', 'mailing_list'])
    }).strict()
  ).optional()
}).strict();
export type EsiMailHeader = z.infer<typeof EsiMailHeaderSchema>;
