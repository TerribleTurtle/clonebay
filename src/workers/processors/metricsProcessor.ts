/* eslint-disable no-restricted-syntax, max-lines */
import { fetchSdeSystem } from "../../services/esi/sdeClient";
import { logger } from "../../utils/logger";
import { mockFleet } from "../../utils/mockFleet";
import type {
  EsiSkillQueue,
  EsiCharacterSkillsResponse,
  EsiWallet,
  EsiLocation,
  EsiShip,
  EsiClones,
  EsiFatigue,
  EsiTransaction,
  EsiMailLabels,
  EsiContract,
  EsiMarketOrder,
} from "../../schemas/esi";
import type { EsiResponse } from "../../services/esi/esiClient";
import {
  calculateWalletStatus,
  calculateMailStatus,
  calculateCloneStatus,
  calculateLocationStatus,
} from "../../utils/thresholds";
import { NameCacheService } from "../../services/NameCacheService";
import type { IEsiService } from "../../services/esi/IEsiService";

const INFOMORPH_PSYCHOLOGY_SKILL_ID = 164;
const ADVANCED_INFOMORPH_PSYCHOLOGY_SKILL_ID = 24063;
const ELITE_INFOMORPH_PSYCHOLOGY_SKILL_ID = 73910;
const MAX_UNREAD_MAILS_TO_FETCH = 3;
const ATTRIBUTE_SECONDARY_DIVISOR = 2;
const MINUTES_PER_HOUR = 60;

export interface EsiMetricsContext {
  charId: string;
  charName: string | undefined;
  charSkillsResult: EsiResponse<EsiCharacterSkillsResponse> | null | undefined;
  walletResult: EsiResponse<EsiWallet> | null | undefined;
  locationResult: EsiResponse<EsiLocation> | null | undefined;
  shipResult: EsiResponse<EsiShip> | null | undefined;
  skillsResult: EsiResponse<EsiSkillQueue[]> | null | undefined;
  clonesResult: EsiResponse<EsiClones> | null | undefined;
  fatigueResult: EsiResponse<EsiFatigue> | null | undefined;
  transactionsResult: EsiResponse<EsiTransaction[]> | null | undefined;
  mailLabelsResult: EsiResponse<EsiMailLabels> | null | undefined;
  contractsResult: EsiResponse<EsiContract[]> | null | undefined;
  marketOrdersResult: EsiResponse<EsiMarketOrder[]> | null | undefined;
  isMockMode: boolean;
  postMessage: (msg: unknown) => void;
  esiService: IEsiService;
  accessToken: string;
}

export async function processMetrics(context: EsiMetricsContext) {
  const {
    charId,
    charName,
    charSkillsResult,
    walletResult,
    locationResult,
    shipResult,
    skillsResult,
    clonesResult,
    fatigueResult,
    transactionsResult,
    mailLabelsResult,
    contractsResult,
    marketOrdersResult,
    isMockMode,
    postMessage,
    esiService,
    accessToken,
  } = context;
  try {
    const mockChar = isMockMode
      ? mockFleet.find((c) => c.characterId === charId)
      : null;

    let totalSp = charSkillsResult?.data?.total_sp;
    const unallocatedSp = charSkillsResult?.data?.unallocated_sp || 0;

    let maxClones = 0;
    if (charSkillsResult?.data?.skills) {
      const infomorphLevel = charSkillsResult.data.skills.find(s => s.skill_id === INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
      const advInfomorphLevel = charSkillsResult.data.skills.find(s => s.skill_id === ADVANCED_INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
      const eliteInfomorphLevel = charSkillsResult.data.skills.find(s => s.skill_id === ELITE_INFOMORPH_PSYCHOLOGY_SKILL_ID)?.active_skill_level || 0;
      const calculatedMax = infomorphLevel + advInfomorphLevel + eliteInfomorphLevel;
      const currentClones = clonesResult?.data?.jump_clones?.length || 0;
      maxClones = Math.max(calculatedMax, currentClones);
    }

    if (totalSp !== undefined && skillsResult?.data) {
      const now = Date.now();
      const activeSkill = skillsResult.data.find((s) => {
        if (!s.start_date || !s.finish_date) return false;
        const start = new Date(s.start_date).getTime();
        const finish = new Date(s.finish_date).getTime();
        return now >= start && now <= finish;
      });

      if (activeSkill && activeSkill.start_date && activeSkill.finish_date) {
        const start = new Date(activeSkill.start_date).getTime();
        const finish = new Date(activeSkill.finish_date).getTime();
        const durationMs = finish - start;
        const elapsedMs = now - start;
        if (durationMs > 0 && elapsedMs > 0) {
          const spToTrain =
            activeSkill.level_end_sp - activeSkill.training_start_sp;
          const spPerMs = spToTrain / durationMs;
          totalSp += Math.floor(elapsedMs * spPerMs);
        }
      }
    }

    const isk = walletResult?.data;
    const locationId = locationResult?.data?.solar_system_id;
    const stationId = locationResult?.data?.station_id;
    const structureId = locationResult?.data?.structure_id;
    const location = locationResult?.data;
    const ship = shipResult?.data;

    let locationName = undefined;
    let stationName = undefined;

    if (locationId) {
      locationName = await fetchSdeSystem(locationId).catch((err) => {
        logger.error(`Failed to fetch SDE system name for ${locationId}`, err);
        return undefined;
      });
    }
    
    if (stationId) {
      const nameCache = new NameCacheService();
      const resolved = await nameCache.resolveIdsToNames([stationId], esiService).catch(() => ({} as Record<number, string>));
      stationName = resolved[stationId];
    }

    const clones = clonesResult?.data;
    const fatigue = fatigueResult?.data;
    const transactions = transactionsResult?.data
      ? { count: transactionsResult.data.length }
      : undefined;
    const mail = mailLabelsResult?.data;
    const contracts = contractsResult?.data
      ? { count: contractsResult.data.length }
      : undefined;
    const marketOrders = marketOrdersResult?.data
      ? { count: marketOrdersResult.data.length }
      : undefined;

    const now = Date.now();
    const walletStatus = calculateWalletStatus(isk);
    const locationStatus = calculateLocationStatus(stationId, structureId);
    const mailStatus = calculateMailStatus(mail?.total_unread_count);
    const cloneStatus = calculateCloneStatus(clones?.last_clone_jump_date, now);

    // --- Hover Context Generation: Metrics Update ---
    const nameCache = new NameCacheService();
    let clonesContext:
      | { locationName: string; implants: string[] }[]
      | undefined = undefined;
    let mailContext: { unreadSubjects: string[] } | undefined = undefined;
    let spContext:
      | { current: number; unallocated: number; ratePerHour: number }
      | undefined = undefined;

    try {
      // 1. Clones Context
      if (clones && clones.jump_clones) {
        // Collect all location_ids and implant type_ids to resolve
        const idsToResolve = new Set<number>();
        for (const c of clones.jump_clones) {
          if (c.location_id) idsToResolve.add(c.location_id);
          if (c.implants) {
            c.implants.forEach((imp) => idsToResolve.add(imp));
          }
        }

        const resolvedNames = await nameCache.resolveIdsToNames(
          Array.from(idsToResolve),
          esiService,
        );

        clonesContext = clones.jump_clones.map((c) => ({
          locationName: c.location_id
            ? resolvedNames[c.location_id] || c.location_id.toString()
            : "Unknown",
          implants: c.implants
            ? c.implants.map((imp) => resolvedNames[imp] || imp.toString())
            : [],
        }));
      }

      // 2. Mail Context
      try {
        const mailResponse = await esiService.getMail(charId, accessToken);
        if (mailResponse && mailResponse.data) {
          const unreadMails = mailResponse.data
            .filter((m) => m.is_read === false)
            .slice(0, MAX_UNREAD_MAILS_TO_FETCH);
          if (unreadMails.length > 0) {
            const senderIds = unreadMails
              .map((m) => m.from)
              .filter((id) => id !== undefined) as number[];
            const resolvedSenders = await nameCache.resolveIdsToNames(
              senderIds,
              esiService,
            );
            const unreadSubjects = unreadMails.map((m) => {
              const senderName = m.from
                ? resolvedSenders[m.from] || m.from.toString()
                : "Unknown";
              return `${senderName}: ${m.subject}`;
            });
            mailContext = { unreadSubjects };
          } else {
            mailContext = { unreadSubjects: [] };
          }
        }
      } catch (e) {
        logger.warn(`Failed to fetch mail for hover context for ${charId}`, e);
      }

      // 3. SP Context
      try {
        if (totalSp !== undefined) {
          const attrsResponse = await esiService.getAttributes(
            charId,
            accessToken,
          );
          if (attrsResponse && attrsResponse.data) {
            const { intelligence, memory } = attrsResponse.data;
            // EVE calculation approximation:
            // ratePerHour = (primary + (secondary / 2)) * 60
            // Assuming intelligence/memory are the attributes used for the active skill as we don't have skill attributes mapping
            // It's a rough approximation for the Hover Context
            const primary = intelligence || 0;
            const secondary = memory || 0;
            const ratePerHour = (primary + secondary / ATTRIBUTE_SECONDARY_DIVISOR) * MINUTES_PER_HOUR;
            spContext = {
              current: totalSp,
              unallocated: unallocatedSp,
              ratePerHour,
            };
          }
        }
      } catch (e) {
        logger.warn(
          `Failed to fetch attributes for SP rate context for ${charId}`,
          e,
        );
      }
    } catch (e) {
      logger.error(
        `Error generating hover contexts for metrics processor for ${charId}`,
        e,
      );
    }
    // ------------------------------------------------

    postMessage({
      type: "ESI_METRICS_UPDATE",
      payload: {
        characterId: charId,
        name: charName || mockChar?.characterName,
        isk,
        totalSp,
        unallocatedSp,
        maxClones,
        locationId,
        locationName,
        stationId,
        stationName,
        structureId,
        location,
        ship,
        clones,
        fatigue,
        transactions,
        mail,
        contracts,
        marketOrders,
        walletStatus,
        locationStatus,
        mailStatus,
        cloneStatus,
        clonesContext,
        mailContext,
        spContext,
      },
    });
  } catch (err) {
    logger.error(`ESI Worker: Error processing metrics for ${charId}`, err);
    postMessage({
      type: "ESI_METRICS_UPDATE",
      payload: {
        characterId: charId,
        walletStatus: "Red",
        locationStatus: "Red",
        mailStatus: "Red",
        cloneStatus: "Red",
      },
    });
  }
}
