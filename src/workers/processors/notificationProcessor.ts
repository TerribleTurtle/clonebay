import type { IEsiService } from '../../services/esi/IEsiService';
import { logger } from '../../utils/logger';
import type { EsiNotification, EsiWar } from '../../schemas/esi';

export interface NotificationProcessorResult {
  warStatus: 'Green' | 'Yellow' | 'Red' | 'Offline';
  warContext?: { alerts: string[] };
}

export async function processNotifications(
  charId: string,
  notifications: EsiNotification[],
  esiService: IEsiService,
  postMessage: (msg: unknown) => void
): Promise<void> {
  let warStatus: 'Green' | 'Yellow' | 'Red' | 'Offline' = 'Green';
  const alerts: string[] = [];
  
  // Filter for war-related notifications in the last 30 days
  const now = Date.now();
  // eslint-disable-next-line no-magic-numbers
  const thirtyDaysMs = 30 * 24 * 3600 * 1000;
  
  const warNotifications = notifications.filter(n => {
    if (n.type !== 'WarDeclared' && n.type !== 'AllyJoinedWarMsg') return false;
    const notificationTime = new Date(n.timestamp).getTime();
    return (now - notificationTime) < thirtyDaysMs;
  });

  if (warNotifications.length > 0) {
    // Collect unique war IDs
    const warIds = new Set<number>();
    for (const n of warNotifications) {
      if (n.text) {
        const match = n.text.match(/warID:\s*(\d+)/);
        if (match && match[1]) {
          warIds.add(parseInt(match[1], 10));
        }
      }
    }

    const activeWars: EsiWar[] = [];
    const pendingWars: EsiWar[] = [];
    const entityIdsToResolve = new Set<number>();

    // Fetch details for each war
    for (const warId of Array.from(warIds)) {
      try {
        const warResponse = await esiService.universe.getWar(warId);
        if (warResponse && warResponse.data) {
          const war = warResponse.data;
          
          let isActive = false;
          let isPending = false;
          
          if (war.finished) {
            const finishedTime = new Date(war.finished).getTime();
            if (finishedTime > now) {
               if (war.started && new Date(war.started).getTime() <= now) {
                 isActive = true;
               } else {
                 isPending = true;
               }
            }
          } else {
            // No finished time = either pending or active
            if (war.started && new Date(war.started).getTime() <= now) {
              isActive = true;
            } else {
              isPending = true;
            }
          }

          if (isActive) {
            activeWars.push(war);
            if (war.aggressor.corporation_id) entityIdsToResolve.add(war.aggressor.corporation_id);
            if (war.aggressor.alliance_id) entityIdsToResolve.add(war.aggressor.alliance_id);
          } else if (isPending) {
            pendingWars.push(war);
            if (war.aggressor.corporation_id) entityIdsToResolve.add(war.aggressor.corporation_id);
            if (war.aggressor.alliance_id) entityIdsToResolve.add(war.aggressor.alliance_id);
          }
        }
      } catch (error) {
        logger.error(`ESI Worker: Error fetching war details for warId ${warId}`, error);
        warStatus = 'Offline';
        alerts.push(`Failed to fetch details for war ID ${warId}`);
        throw error;
      }
    }

    // Resolve names for aggressors
    const entityNames: Record<number, string> = {};
    if (entityIdsToResolve.size > 0) {
      try {
        const resolveResponse = await esiService.universe.resolveNames(Array.from(entityIdsToResolve));
        if (resolveResponse && resolveResponse.data) {
          for (const item of resolveResponse.data) {
            entityNames[item.id] = item.name;
          }
        }
      } catch (error) {
        logger.error(`ESI Worker: Error resolving names for wars`, error);
        throw error;
      }
    }

    if (activeWars.length > 0) {
      warStatus = 'Red';
      for (const war of activeWars) {
        const aggressorId = war.aggressor.alliance_id || war.aggressor.corporation_id;
        const aggressorName = aggressorId && entityNames[aggressorId] ? entityNames[aggressorId] : 'Unknown Aggressor';
        alerts.push(`Active War against ${aggressorName}`);
        if (war.finished) {
          alerts.push(`Ends: ${new Date(war.finished).toLocaleString()}`);
        }
      }
    } else if (pendingWars.length > 0) {
      warStatus = 'Yellow';
      for (const war of pendingWars) {
        const aggressorId = war.aggressor.alliance_id || war.aggressor.corporation_id;
        const aggressorName = aggressorId && entityNames[aggressorId] ? entityNames[aggressorId] : 'Unknown Aggressor';
        alerts.push(`Pending War against ${aggressorName}`);
        if (war.started) {
          alerts.push(`Starts: ${new Date(war.started).toLocaleString()}`);
        }
      }
    }
  }

  if (warStatus === 'Green' && alerts.length === 0) {
    alerts.push('No Active Wars');
  }

  postMessage({
    type: 'ESI_DATA_UPDATE',
    payload: {
      characterId: charId,
      dataType: 'war',
      status: warStatus,
      data: {
        warStatus,
        warContext: alerts.length > 0 ? { alerts } : undefined
      }
    }
  });
}
