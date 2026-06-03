import { useLogStore, LogEntry } from '../store/useLogStore';

type LogLevel = 'info' | 'warn' | 'error';

function createLog(level: LogLevel, message: string, data?: unknown) {
  const isWorker = typeof window === 'undefined';
  // Sanitize data to avoid DataCloneError in workers
  let safeData = data;
  if (data instanceof Error) {
    safeData = { name: data.name, message: data.message, stack: data.stack };
  } else if (data !== undefined && data !== null) {
    try {
      safeData = JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.error('Failed to stringify log data:', error);
      safeData = '[Uncloneable Object]';
    }
  }

  const logEntry: LogEntry = {
    id: crypto.randomUUID(),
    /* eslint-disable-next-line no-restricted-syntax */
      timestamp: Date.now(),
    level,
    message,
    source: isWorker ? 'worker' : 'main',
    data: safeData,
  };

  if (isWorker) {
    postMessage({ type: 'WORKER_LOG', payload: logEntry });
  } else {
    useLogStore.getState().addLog(logEntry);
  }

  // Preserve native console logging for development
  if (level === 'error') {
    console.error(`[${logEntry.source}]`, message, data !== undefined ? data : '');
  } else if (level === 'warn') {
    console.warn(`[${logEntry.source}]`, message, data !== undefined ? data : '');
  } else {
    console.info(`[${logEntry.source}]`, message, data !== undefined ? data : '');
  }
}

export const logger = {
  info: (message: string, data?: unknown) => createLog('info', message, data),
  warn: (message: string, data?: unknown) => createLog('warn', message, data),
  error: (message: string, data?: unknown) => createLog('error', message, data),
};
