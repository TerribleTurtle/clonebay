import { calculatePiStatus, type PiPinState } from '../../utils/thresholds';
import { type EsiPlanet } from '../../schemas/esi';
import type { EsiResponse } from '../../services/esi/esiClient';

import { logger } from '../../utils/logger';

import { IEsiService } from '../../services/esi/IEsiService';
import { PI_SDE_DATA } from '../../utils/piSdeData';
import { NameCacheService } from '../../services/NameCacheService';

const PI_GROUP_COMMAND_CENTER = 1043;
const PI_GROUP_SPACEPORT = 1048;
const PI_GROUP_STORAGE_FACILITY = 1064;
const PI_GROUP_EXTRACTOR_CONTROL_UNIT = 1063;

export async function processPi(
  charId: string,
  planetsResult: EsiResponse<EsiPlanet[]> | null,
  esiService: IEsiService,
  accessToken: string,
  postMessage: (msg: unknown) => void
) {
  if (planetsResult && planetsResult.data) {
    try {
      const layoutPromises = planetsResult.data.map(p => {
        return esiService.getPlanetLayout(charId, accessToken, p.planet_id);
      });
      
      const layouts = await Promise.all(layoutPromises);

      const allPins: PiPinState[] = [];
      for (let i = 0; i < layouts.length; i++) {
        const layoutRes = layouts[i];
        const planetId = planetsResult.data[i]?.planet_id || 0;
        if (!layoutRes || !layoutRes.data || !layoutRes.data.pins) continue;
        
        for (const pin of layoutRes.data.pins) {
          const sdeData = PI_SDE_DATA[pin.type_id];
          if (!sdeData) continue;

          const groupId = sdeData.group_id;
          const isStorage = groupId === PI_GROUP_COMMAND_CENTER || groupId === PI_GROUP_SPACEPORT || groupId === PI_GROUP_STORAGE_FACILITY;
          const isExtractor = groupId === PI_GROUP_EXTRACTOR_CONTROL_UNIT;
          
          let storageCapacity: number | undefined = undefined;
          let storageUsed: number | undefined = undefined;

          if (isStorage) {
            storageCapacity = sdeData.capacity;
            storageUsed = 0;
            if (pin.contents) {
              for (const item of pin.contents) {
                const itemSde = PI_SDE_DATA[item.type_id];
                const volume = itemSde?.volume || 0;
                storageUsed += item.amount * volume;
              }
            }
          }

          const pinState: PiPinState = {
            planetId: planetId,
            isExtractor,
            isStorage,
            hasUnroutedMaterials: false
          };

          if (pin.expiry_time !== undefined) pinState.extractorExpiryTime = pin.expiry_time;
          if (storageCapacity !== undefined) pinState.storageCapacity = storageCapacity;
          if (storageUsed !== undefined) pinState.storageUsed = storageUsed;

          allPins.push(pinState);
        }
      }

      const { status, alerts } = calculatePiStatus(allPins, Date.now());
      
      const piContext: { alerts: string[] } = { alerts: [] };
      if (alerts && alerts.length > 0) {
        const nameCache = new NameCacheService();
        const planetIds = Array.from(new Set(alerts.map(a => a.planetId)));
        
        const systemIds = planetIds.map(pid => planetsResult.data?.find(p => p.planet_id === pid)?.solar_system_id).filter((id): id is number => id !== undefined);
        const idsToResolve = Array.from(new Set([...planetIds, ...systemIds]));
        const resolvedNames = await nameCache.resolveIdsToNames(idsToResolve);
        
        piContext.alerts = alerts.map(a => {
          const planetInfo = planetsResult.data?.find(p => p.planet_id === a.planetId);
          const planetName = resolvedNames[a.planetId] || `Planet ${a.planetId}`;
          const systemName = planetInfo && resolvedNames[planetInfo.solar_system_id] ? resolvedNames[planetInfo.solar_system_id] : 'Unknown System';
          const typeName = planetInfo?.planet_type ? ` (${planetInfo.planet_type})` : '';
          
          return `${systemName} - ${planetName}${typeName}: ${a.message}`;
        });
      } else {
        const planetCount = planetsResult.data?.length || 0;
        if (planetCount === 0) {
          piContext.alerts.push(`No Planetary Interaction networks detected.`);
        } else {
          piContext.alerts.push(`${planetCount} Planets Active. All operations running optimally.`);
        }
      }

      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'pi', status, data: planetsResult.data, piContext }
      });
     
    } catch (error) {
      logger.error(`ESI Worker: Error processing PI layouts for ${charId}`, error);
      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null }
      });
    }
  } else if (planetsResult?.status === 'Offline') {
    postMessage({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: charId, dataType: 'pi', status: 'Offline', data: null }
    });
  } else {
    postMessage({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: charId, dataType: 'pi', status: 'Red', data: null }
    });
  }
}
