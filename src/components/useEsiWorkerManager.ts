import { useEffect } from 'react';
import { useCharacterStore, CharacterStatus } from '../store/useCharacterStore';
import { useLogStore } from '../store/useLogStore';
import { WorkerManager } from '../workers/WorkerManager';
import { logger } from '../utils/logger';

export const useEsiWorkerManager = () => {
  useEffect(() => {
    let unsubscribe: () => void;
    let flushTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const manager = WorkerManager.getInstance(() => new Worker(new URL('../workers/esiWorker.ts', import.meta.url)));
      
      let pendingUpdates: Record<string, Partial<CharacterStatus>> = {};
      const flushUpdates = () => {
        if (Object.keys(pendingUpdates).length > 0) {
          useCharacterStore.getState().updateMultipleCharacters(pendingUpdates);
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
          // eslint-disable-next-line no-magic-numbers
          flushTimeout = setTimeout(flushUpdates, 50);
        }
      };
      
      unsubscribe = manager.subscribe((event) => {
        const { type, payload, timestamp } = event.data;
        if (type === 'ESI_DATA_UPDATE') {
          const updatePayload: Partial<CharacterStatus> = { [payload.dataType]: payload.status };
          if (payload.dataType === 'skills' && payload.skillsContext) updatePayload.skillsContext = payload.skillsContext;
          if (payload.dataType === 'pi' && payload.piContext) updatePayload.piContext = payload.piContext;
          if (payload.dataType === 'industry' && payload.indyContext) updatePayload.indyContext = payload.indyContext;
          if (payload.maxClones !== undefined) updatePayload.maxClones = payload.maxClones;
          queueUpdate(payload.characterId, updatePayload);
        } else if (type === 'ESI_METRICS_UPDATE') {
          const { characterId, ...metrics } = payload;
          queueUpdate(characterId, metrics);
        } else if (type === 'POLL_COMPLETE') {
          useCharacterStore.getState().setLastPolled(timestamp);
        } else if (type === 'WORKER_LOG') {
          useLogStore.getState().addLog(payload);
        }
      });
      
      const isMock = localStorage.getItem('eve_mock_mode') === 'true';
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
      WorkerManager.getInstance().stop();
    };
  }, []);
};
