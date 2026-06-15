import { create } from 'zustand';

import { LogEntry, addLogListener } from '../utils/logger';

 
const MAX_LOGS = 100;

interface LogStore {
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogStore>()(
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
  })
);

addLogListener(useLogStore.getState().addLog);
