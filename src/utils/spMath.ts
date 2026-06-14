import type { EsiSkillQueue } from "../schemas/esi";

export function calculateTotalSp(
  totalSp: number | undefined,
  skillsData: EsiSkillQueue[] | undefined,
  nowMs: number
): number | undefined {
  if (totalSp === undefined || !skillsData) return totalSp;

  let computedSp = totalSp;
  const activeSkill = skillsData.find((s) => {
    if (!s.start_date || !s.finish_date) return false;
    const start = new Date(s.start_date).getTime();
    const finish = new Date(s.finish_date).getTime();
    return nowMs >= start && nowMs <= finish;
  });

  if (activeSkill && activeSkill.start_date && activeSkill.finish_date) {
    const start = new Date(activeSkill.start_date).getTime();
    const finish = new Date(activeSkill.finish_date).getTime();
    const durationMs = finish - start;
    const elapsedMs = nowMs - start;
    if (durationMs > 0 && elapsedMs > 0) {
      const spToTrain = activeSkill.level_end_sp - activeSkill.training_start_sp;
      const spPerMs = spToTrain / durationMs;
      computedSp += Math.floor(elapsedMs * spPerMs);
    }
  }

  return computedSp;
}
