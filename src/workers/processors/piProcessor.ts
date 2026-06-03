import { calculatePiStatus, type PiPinState } from '../../utils/thresholds';
import { type EsiPlanet, type EsiSdeType } from '../../schemas/esi';
import type { EsiResponse } from '../../utils/esiClient';
import { fetchSdeType } from '../../utils/sdeClient';
import { logger } from '../../utils/logger';

import { IEsiService } from '../../services/esi/IEsiService';

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
      const typeIdsToFetch = new Set<number>();
      for (const layoutRes of layouts) {
        if (!layoutRes || !layoutRes.data || !layoutRes.data.pins) continue;
        for (const pin of layoutRes.data.pins) {
          typeIdsToFetch.add(pin.type_id);
          if (pin.contents) {
            for (const item of pin.contents) {
              typeIdsToFetch.add(item.type_id);
            }
          }
        }
      }

      const sdePromises = Array.from(typeIdsToFetch).map(id => 
        fetchSdeType(id).then(data => ({ id, data }))
      );
      const sdeResults = await Promise.all(sdePromises);
      const sdeMap = new Map<number, EsiSdeType>();
      for (const res of sdeResults) {
        sdeMap.set(res.id, res.data);
      }

      const allPins: PiPinState[] = [];
      for (const layoutRes of layouts) {
        if (!layoutRes || !layoutRes.data || !layoutRes.data.pins) continue;
        
        for (const pin of layoutRes.data.pins) {
          const sdeData = sdeMap.get(pin.type_id);
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
                const itemSde = sdeMap.get(item.type_id);
                const volume = itemSde?.volume || 0;
                storageUsed += item.amount * volume;
              }
            }
          }

          const pinState: PiPinState = {
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

      const status = calculatePiStatus(allPins, Date.now());
      postMessage({
        type: 'ESI_DATA_UPDATE',
        payload: { characterId: charId, dataType: 'pi', status, data: planetsResult.data }
      });
    // eslint-disable-next-line no-restricted-syntax
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
