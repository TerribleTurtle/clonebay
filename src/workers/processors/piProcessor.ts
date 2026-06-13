import { calculatePiStatus, type PiPinState } from '../../utils/thresholds';
import { type EsiPlanet } from '../../schemas/esi';
import type { EsiResponse } from '../../services/esi/esiClient';

import { logger } from '../../utils/logger';

import { IEsiService } from '../../services/esi/IEsiService';
import { PI_SDE_DATA } from '../../utils/piSdeData';

const PI_GROUP_COMMAND_CENTER = 1043;
const PI_GROUP_SPACEPORT = 1048;
const PI_GROUP_STORAGE_FACILITY = 1064;
const PI_GROUP_EXTRACTOR_CONTROL_UNIT = 1063;

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

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

export async function processPi(
  charId: string,
  planetsResult: EsiResponse<EsiPlanet[]> | null,
  esiService: IEsiService,
  accessToken: string,
  nameCache: import('../../services/NameCacheService').NameCacheService,
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
        const planetIds = Array.from(new Set(alerts.map(a => a.planetId)));
        
        const systemIds = planetIds.map(pid => planetsResult.data?.find(p => p.planet_id === pid)?.solar_system_id).filter((id): id is number => id !== undefined);
        const idsToResolve = Array.from(new Set([...planetIds, ...systemIds]));
        const resolvedNames = await nameCache.resolveIdsToNames(idsToResolve);
        
        piContext.alerts = alerts.map(a => {
          const planetInfo = planetsResult.data?.find(p => p.planet_id === a.planetId);
          const planetName = resolvedNames[a.planetId] || `Planet ${a.planetId}`;
          const systemName = planetInfo && resolvedNames[planetInfo.solar_system_id] ? resolvedNames[planetInfo.solar_system_id] : 'Unknown System';
          const typeName = planetInfo?.planet_type ? ` (${planetInfo.planet_type})` : '';
          
          let timerStr = '';
          if (a.message.includes('Extraction Program')) {
             const pin = allPins.find(p => p.planetId === a.planetId && p.isExtractor);
             if (pin && pin.extractorExpiryTime) {
                const remaining = Math.max(0, new Date(pin.extractorExpiryTime).getTime() - Date.now());
                timerStr = ` (${formatDuration(remaining)})`;
             }
          }
          
          return `${systemName} - ${planetName}${typeName}: ${a.message}${timerStr}`;
        });
      } else {
        const planetCount = planetsResult.data?.length || 0;
        if (planetCount === 0) {
          piContext.alerts.push(`No Planetary Interaction networks detected.`);
        } else {
          piContext.alerts.push(`${planetCount} Planets Active.`);
          
          const planetIds = planetsResult.data?.map(p => p.planet_id) || [];
          const systemIds = planetsResult.data?.map(p => p.solar_system_id).filter((id): id is number => id !== undefined) || [];
          const idsToResolve = Array.from(new Set([...planetIds, ...systemIds]));
          const resolvedNames = await nameCache.resolveIdsToNames(idsToResolve);
          
          const activeExtractors = allPins.filter(p => p.isExtractor && p.extractorExpiryTime);
          activeExtractors.sort((a, b) => new Date(a.extractorExpiryTime!).getTime() - new Date(b.extractorExpiryTime!).getTime());
          
          for (const ext of activeExtractors) {
             const planetInfo = planetsResult.data?.find(p => p.planet_id === ext.planetId);
             const systemName = planetInfo && resolvedNames[planetInfo.solar_system_id] ? resolvedNames[planetInfo.solar_system_id] : 'Unknown';
             const planetName = resolvedNames[ext.planetId] || `Planet ${ext.planetId}`;
             const remaining = Math.max(0, new Date(ext.extractorExpiryTime!).getTime() - Date.now());
             piContext.alerts.push(`${systemName} - ${planetName}: ${formatDuration(remaining)}`);
          }
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
