import { useEffect } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { useLogStore } from '../store/useLogStore';
import { WorkerManager } from '../utils/WorkerManager';
import { logger } from '../utils/logger';

export const useEsiWorkerManager = () => {
  useEffect(() => {
    let unsubscribe: () => void;
    try {
      const manager = WorkerManager.getInstance();
      
      unsubscribe = manager.subscribe((event) => {
        const { type, payload, timestamp } = event.data;
        if (type === 'ESI_DATA_UPDATE') {
          useCharacterStore.getState().updateCharacterStatus(payload.characterId, {
            [payload.dataType]: payload.status
          });
        } else if (type === 'ESI_METRICS_UPDATE') {
          useCharacterStore.getState().updateCharacterStatus(payload.characterId, {
            name: payload.name,
            isk: payload.isk,
            totalSp: payload.totalSp,
            unallocatedSp: payload.unallocatedSp,
            locationId: payload.locationId,
            locationName: payload.locationName,
            stationId: payload.stationId,
            structureId: payload.structureId
          });
        } else if (type === 'POLL_COMPLETE') {
          useCharacterStore.getState().setLastPolled(timestamp);
        } else if (type === 'WORKER_LOG') {
          useLogStore.getState().addLog(payload);
        }
      });
      
      const isMock = localStorage.getItem('eve_mock_mode') === 'true';
      manager.start(isMock);
    } catch (error) {
      logger.error("Failed to start ESI Worker via WorkerManager:", error);
      throw error; // Fail loudly
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      WorkerManager.getInstance().stop();
    };
  }, []);
};
