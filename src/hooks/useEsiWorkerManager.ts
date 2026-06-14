import { useEffect } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { CharacterStatus } from '../store/slices/types';
import { useLogStore } from '../store/useLogStore';
import { WorkerService } from '../services/WorkerService';
import { useSettingsStore } from '../store/useSettingsStore';
import { logger } from '../utils/logger';

const BATCH_FLUSH_DELAY_MS = 50;

export const useEsiWorkerManager = () => {
  useEffect(() => {
    let unsubscribe: () => void;
    let flushTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const manager = WorkerService.getManager();
      
      let pendingUpdates: Record<string, Partial<CharacterStatus>> = {};
      const flushUpdates = () => {
        if (Object.keys(pendingUpdates).length > 0) {
          useBoundStore.getState().updateMultipleCharacters(pendingUpdates);
          pendingUpdates = {};
        }
        flushTimeout = null;
      };
      
      const queueUpdate = (id: string, payload: Partial<CharacterStatus>) => {
        if (!pendingUpdates[id]) {
          pendingUpdates[id] = {};
        }
        pendingUpdates[id] = { ...pendingUpdates[id], ...payload };
        
        if (!flushTimeout) {
          flushTimeout = setTimeout(flushUpdates, BATCH_FLUSH_DELAY_MS);
        }
      };
      
      unsubscribe = manager.subscribe((event) => {
        const { type, payload, timestamp } = event.data;
        if (type === 'ESI_DATA_UPDATE') {
          const stateKey = payload.dataType === 'war' ? 'warStatus' : payload.dataType;
          const updatePayload: Partial<CharacterStatus> = { [stateKey]: payload.status };
          if (payload.dataType === 'skills' && payload.skillsContext) updatePayload.skillsContext = payload.skillsContext;
          if (payload.dataType === 'pi' && payload.piContext) updatePayload.piContext = payload.piContext;
          if (payload.dataType === 'industry' && payload.indyContext) updatePayload.indyContext = payload.indyContext;
          if (payload.dataType === 'war' && payload.data?.warContext) updatePayload.warContext = payload.data.warContext;
          if (payload.maxClones !== undefined) updatePayload.maxClones = payload.maxClones;
          queueUpdate(payload.characterId, updatePayload);
        } else if (type === 'ESI_METRICS_UPDATE') {
          const { characterId, ...metrics } = payload;
          queueUpdate(characterId, metrics);
        } else if (type === 'POLL_COMPLETE') {
          useBoundStore.getState().setLastPolled(timestamp);
        } else if (type === 'WORKER_LOG') {
          useLogStore.getState().addLog(payload);
        }
      });
      
      const isMock = useSettingsStore.getState().isMockMode;
      manager.start(isMock);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[useEsiWorkerManager] Critical Failure: ESI Web Worker failed to initialize or start. Background polling is offline. Details: ${errorMessage}`, error);
      throw error; // Fail loudly
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (flushTimeout) clearTimeout(flushTimeout);
      WorkerService.getManager().stop();
    };
  }, []);
};
