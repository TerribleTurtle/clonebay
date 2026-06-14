import { calculateSkillQueueStatus } from "../../utils/thresholds";
import type { EsiSkillQueue } from "../../schemas/esi";
import type { EsiResponse } from "../../services/esi/esiClient";
import { logger } from "../../utils/logger";

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

const MAX_DISPLAYED_SKILLS = 3;

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const minutes = Math.floor((ms / MS_PER_MINUTE) % SECONDS_PER_MINUTE);
  const hours = Math.floor((ms / MS_PER_HOUR) % HOURS_PER_DAY);
  const days = Math.floor(ms / MS_PER_DAY);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) return '< 1m';
  return parts.join(' ');
}

export async function processSkills(
  charId: string,
  skillsResult: EsiResponse<EsiSkillQueue[]> | null,
  nameCache: import('../../services/NameCacheService').NameCacheService,
  postMessage: (msg: unknown) => void
) {
  try {
    if (skillsResult && skillsResult.data) {
      const now = Date.now();
      const status = calculateSkillQueueStatus(skillsResult.data, now);

      let skillsContext:
        | { activeSkill: string; timeRemaining: number; queue: string[] }
        | undefined = undefined;

      try {
        const top3 = skillsResult.data.slice(0, MAX_DISPLAYED_SKILLS);
        if (top3.length > 0) {
          const skillIds = top3.map((s) => s.skill_id);
          const resolvedNames = await nameCache.resolveIdsToNames(
            skillIds
          );

          const queue = top3.map(
            (s) => resolvedNames[s.skill_id] || s.skill_id.toString(),
          );
          const activeSkillData = top3[0];

          if (activeSkillData) {
            const activeSkillName =
              resolvedNames[activeSkillData.skill_id] ||
              activeSkillData.skill_id.toString();

            let timeRemaining = 0;
            if (activeSkillData.finish_date) {
              const finish = new Date(activeSkillData.finish_date).getTime();
              timeRemaining = Math.max(0, finish - now);
            }

            let totalQueueTimeRemaining = 0;
            const lastSkill = skillsResult.data[skillsResult.data.length - 1];
            if (lastSkill && lastSkill.finish_date) {
              const totalFinish = new Date(lastSkill.finish_date).getTime();
              totalQueueTimeRemaining = Math.max(0, totalFinish - now);
            }

            if (totalQueueTimeRemaining > 0) {
              queue.push(`Total Queue: ${formatDuration(totalQueueTimeRemaining)}`);
            }

            skillsContext = {
              activeSkill: activeSkillName,
              timeRemaining,
              queue,
            };
          }
        } else {
          skillsContext = {
            activeSkill: 'None',
            timeRemaining: 0,
            queue: ['Skill Queue is Empty']
          };
        }
      } catch (e) {
        logger.error(
          `Error generating hover context for skills processor for ${charId}`,
          e,
        );
        throw e;
      }

      postMessage({
        type: "ESI_DATA_UPDATE",
        payload: {
          characterId: charId,
          dataType: "skills",
          status,
          data: skillsResult.data,
          skillsContext,
        },
      });
    } else if (skillsResult?.status === "Offline") {
      postMessage({
        type: "ESI_DATA_UPDATE",
        payload: {
          characterId: charId,
          dataType: "skills",
          status: "Offline",
          data: null,
        },
      });
    } else {
      postMessage({
        type: "ESI_DATA_UPDATE",
        payload: {
          characterId: charId,
          dataType: "skills",
          status: "Red",
          data: null,
        },
      });
    }
  } catch (error) {
    logger.error(
      `ESI Worker: Error calculating skills status for ${charId}`,
      error,
    );
    postMessage({
      type: "ESI_DATA_UPDATE",
      payload: {
        characterId: charId,
        dataType: "skills",
        status: "Red",
        data: null,
      },
    });
    throw error;
  }
}
