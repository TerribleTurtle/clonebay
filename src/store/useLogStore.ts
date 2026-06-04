import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
/* eslint-disable no-restricted-syntax */
const MAX_LOGS = 100;

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: 'main' | 'worker';
  data?: unknown;
}

interface LogStore {
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

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
      storage: (() => {
        let storageAdapter;
        try {
          if (typeof localStorage !== 'undefined' && localStorage) {
            storageAdapter = createJSONStorage(() => localStorage);
          }
        } catch (e) {
          console.error('Failed to access localStorage for log store:', e);
        }
        
        // If createJSONStorage returned undefined (e.g. because localStorage is blocked)
        // or if we are in an environment without localStorage, fallback to dummyStorage.
        if (!storageAdapter) {
          storageAdapter = createJSONStorage(() => dummyStorage);
        }
        
        return storageAdapter;
      })(),
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
