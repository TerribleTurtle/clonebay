import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BrowserStorageService } from '../services/BrowserStorageService';
import { LogEntry, addLogListener } from '../utils/logger';

/* eslint-disable no-restricted-syntax */
const MAX_LOGS = 100;

interface LogStore {
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) =>
        set((state) => {
          const newLogs = [log, ...state.logs];
          if (newLogs.length > MAX_LOGS) {
            newLogs.pop();
          }
          return { logs: newLogs };
        }),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'eve-log-store',
      storage: BrowserStorageService.getZustandStorage(),
      partialize: (state) => ({
        ...state,
        logs: state?.logs?.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          source: log.source,
        })) || [],
      }),
    }
  )
);

addLogListener(useLogStore.getState().addLog);
