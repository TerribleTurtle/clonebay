import { z } from 'zod';

const MAX_SKILL_LEVEL = 5;

const BaseSkillQueueSchema = z.object({
  queue_position: z.number().int().min(0),
  skill_id: z.number().int().positive(),
  finish_date: z.string().datetime().optional(),
  start_date: z.string().datetime().optional(),
  level_start_sp: z.number().int().min(0),
  training_start_sp: z.number().int().min(0),
  level_end_sp: z.number().int().positive(),
  finished_level: z.number().int().min(1).max(MAX_SKILL_LEVEL)
}).strict();

export const EsiSkillQueueSchema = BaseSkillQueueSchema.refine(data => {
  // EVE Time-Space Continuum Rule
  if (data.start_date && data.finish_date) {
    if (new Date(data.start_date).getTime() >= new Date(data.finish_date).getTime()) {
      return false;
    }
  }
  // Level 1 Base SP Rule
  if (data.finished_level === 1 && data.level_start_sp !== 0) {
    return false;
  }
  // SP Growth Math (Strict Inequality)
  return data.level_start_sp <= data.training_start_sp && data.training_start_sp < data.level_end_sp;
}, {
  message: "Invalid EVE SP math or timeline"
});
export type EsiSkillQueue = z.infer<typeof EsiSkillQueueSchema>;
