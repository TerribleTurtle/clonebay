import { describe, it, expect, beforeEach } from 'vitest';
import { useLogStore } from '../useLogStore';

describe('useLogStore', () => {
  beforeEach(() => {
    useLogStore.getState().clearLogs();
  });

  it('adds logs and respects MAX_LOGS', () => {
    expect(useLogStore.getState().logs.length).toBe(0);

    useLogStore.getState().addLog({
      id: '1',
      timestamp: Date.now(),
      level: 'info',
      message: 'test log',
      source: 'main'
    });

    expect(useLogStore.getState().logs.length).toBe(1);
    expect(useLogStore.getState().logs[0]?.message).toBe('test log');

    // Add 100 more logs
    for (let i = 0; i < 100; i++) {
      useLogStore.getState().addLog({
        id: `id-${i}`,
        timestamp: Date.now(),
        level: 'info',
        message: `log ${i}`,
        source: 'main'
      });
    }

    // Should not exceed 100
    expect(useLogStore.getState().logs.length).toBe(100);
    expect(useLogStore.getState().logs[0]?.message).toBe('log 99');
  });
});
