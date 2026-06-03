import { create } from 'zustand';

import { persist } from 'zustand/middleware';

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
    }
  )
);
