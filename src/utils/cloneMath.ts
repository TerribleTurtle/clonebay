import type { EsiCharacterSkillsResponse } from "../schemas/esi";

export const INFOMORPH_PSYCHOLOGY_SKILL_ID = 164;
export const ADVANCED_INFOMORPH_PSYCHOLOGY_SKILL_ID = 24063;
export const ELITE_INFOMORPH_PSYCHOLOGY_SKILL_ID = 73910;

export function calculateMaxClones(
  skillsData: EsiCharacterSkillsResponse['skills'] | undefined,
  currentClonesCount: number
): number {
  let maxClones = 0;
  if (skillsData) {
    const infomorphLevel = skillsData.find(s => s.skill_id === INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
    const advInfomorphLevel = skillsData.find(s => s.skill_id === ADVANCED_INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
    const eliteInfomorphLevel = skillsData.find(s => s.skill_id === ELITE_INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
    const calculatedMax = infomorphLevel + advInfomorphLevel + eliteInfomorphLevel;
    maxClones = Math.max(calculatedMax, currentClonesCount);
  }
  return maxClones;
}
