import { z } from 'zod';

export const EsiNotificationSchema = z.object({
  notification_id: z.number().int().positive(),
  sender_id: z.number().int().positive(),
  sender_type: z.string(),
  text: z.string().optional(),
  timestamp: z.string().datetime(),
  type: z.string(),
  is_read: z.boolean().optional()
}).strict();

export type EsiNotification = z.infer<typeof EsiNotificationSchema>;
