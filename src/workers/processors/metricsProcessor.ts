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

import { calculateTotalSp } from "../../utils/spMath";
import { calculateMaxClones } from "../../utils/cloneMath";
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

    const now = Date.now();
    const totalSp = calculateTotalSp(charSkillsResult?.data?.total_sp, skillsResult?.data ?? undefined, now);
    const unallocatedSp = charSkillsResult?.data?.unallocated_sp || 0;
    const currentClonesCount = clonesResult?.data?.jump_clones?.length || 0;
    const maxClones = calculateMaxClones(charSkillsResult?.data?.skills, currentClonesCount);

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
        throw err;
      });
    }
    
    if (stationId) {
      const nameCache = new NameCacheService(esiService.universe);
      const resolved = await nameCache.resolveIdsToNames([stationId]).catch((err) => {
        logger.error(`Failed to resolve station id ${stationId}`, err);
        throw err;
      });
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

    const walletStatus = calculateWalletStatus(isk);
    const locationStatus = calculateLocationStatus(stationId, structureId);
    const mailStatus = calculateMailStatus(mail?.total_unread_count);
    const cloneStatus = calculateCloneStatus(clones?.last_clone_jump_date, now);

    const nameCache = new NameCacheService(esiService.universe);
    const clonesContext = await buildClonesContext(clones || { jump_clones: [] }, nameCache);
    const mailContext = await buildMailContext(charId, esiService, accessToken, nameCache);
    const spContext = await buildSpContext(charId, totalSp, unallocatedSp, esiService, accessToken);


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
    throw err;
  }
}

async function buildClonesContext(clones: EsiClones | undefined, nameCache: NameCacheService) {
  if (!clones?.jump_clones) return undefined;
  try {
    const idsToResolve = new Set<number>();
    for (const c of clones.jump_clones) {
      if (c.location_id) idsToResolve.add(c.location_id);
      if (c.implants) {
        c.implants.forEach((imp) => idsToResolve.add(imp));
      }
    }

    const resolvedNames = await nameCache.resolveIdsToNames(Array.from(idsToResolve));

    return clones.jump_clones.map((c) => ({
      locationName: c.location_id
        ? resolvedNames[c.location_id] || c.location_id.toString()
        : "Unknown",
      implants: c.implants
        ? c.implants.map((imp) => resolvedNames[imp] || imp.toString())
        : [],
    }));
  } catch (e) {
    logger.error(`Failed to build clones context`, e);
    throw e;
  }
}

async function buildMailContext(charId: string, esiService: IEsiService, accessToken: string, nameCache: NameCacheService) {
  try {
    const mailResponse = await esiService.character.getMail(charId, accessToken);
    if (!mailResponse?.data) return undefined;

    const unreadMails = mailResponse.data
      .filter((m) => m.is_read === false)
      .slice(0, MAX_UNREAD_MAILS_TO_FETCH);
      
    if (unreadMails.length === 0) {
      return { unreadSubjects: [] };
    }

    const senderIds = unreadMails
      .map((m) => m.from)
      .filter((id) => id !== undefined) as number[];
    const resolvedSenders = await nameCache.resolveIdsToNames(senderIds);
    
    const unreadSubjects = unreadMails.map((m) => {
      const senderName = m.from
        ? resolvedSenders[m.from] || m.from.toString()
        : "Unknown";
      return `${senderName}: ${m.subject}`;
    });
    
    return { unreadSubjects };
  } catch (e) {
    logger.error(`Failed to fetch mail for hover context for ${charId}`, e);
    throw e;
  }
}

async function buildSpContext(charId: string, totalSp: number | undefined, unallocatedSp: number, esiService: IEsiService, accessToken: string) {
  if (totalSp === undefined) return undefined;
  try {
    const attrsResponse = await esiService.character.getAttributes(charId, accessToken);
    if (!attrsResponse?.data) return undefined;

    const { intelligence, memory } = attrsResponse.data;
    const primary = intelligence || 0;
    const secondary = memory || 0;
    const ratePerHour = (primary + secondary / ATTRIBUTE_SECONDARY_DIVISOR) * MINUTES_PER_HOUR;
    
    return {
      current: totalSp,
      unallocated: unallocatedSp,
      ratePerHour,
    };
  } catch (e) {
    logger.error(`Failed to fetch attributes for SP rate context for ${charId}`, e);
    throw e;
  }
}
