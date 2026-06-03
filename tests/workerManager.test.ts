import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { WorkerManager } from '../src/utils/WorkerManager';
import { logger } from '../src/utils/logger';

vi.mock('../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

/* eslint-disable @typescript-eslint/no-unused-vars */
 
class MockWorker {
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  onerror: ((ev: ErrorEvent) => unknown) | null = null;
  
  constructor(_stringUrl: string | URL) {}
  
  postMessage(_msg: unknown) {}
  
  terminate() {}
}
/* eslint-enable @typescript-eslint/no-unused-vars */
 

beforeAll(() => {
  vi.stubGlobal('Worker', MockWorker);
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // @ts-expect-error accessing private field for testing
  WorkerManager.instance = undefined;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WorkerManager', () => {
  it('should restart worker with exponential backoff on crash', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    // @ts-expect-error accessing private field for testing
    const worker = manager.worker as MockWorker;
    
    // Simulate crash
    worker.onerror?.(new ErrorEvent('error'));
    
    expect(logger.error).toHaveBeenCalledWith('WorkerManager: Worker crashed', expect.any(ErrorEvent));
    
    // Advance timers by backoff 1 (max 2000 due to jitter)
    vi.advanceTimersByTime(2000);
    
    // @ts-expect-error accessing private field for testing
    const worker2 = manager.worker as MockWorker;
    expect(worker2).not.toBe(worker);
    
    // Crash again
    worker2.onerror?.(new ErrorEvent('error'));
    
    // Advance by backoff 2 (max 3000)
    vi.advanceTimersByTime(3000);
    
    // @ts-expect-error accessing private field for testing
    expect(manager.retryAttempt).toBe(2);
  });

  it('should terminate worker and restart on missed PONG', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    // @ts-expect-error accessing private field for testing
    const worker = manager.worker as MockWorker;
    const terminateSpy = vi.spyOn(worker, 'terminate');
    
    // Advance time to trigger PING
    vi.advanceTimersByTime(30000);
    
    // Advance time to trigger PONG timeout
    vi.advanceTimersByTime(5000);
    
    expect(logger.error).toHaveBeenCalledWith('WorkerManager: Missed PONG, terminating worker');
    expect(terminateSpy).toHaveBeenCalled();
  });

  it('should not terminate if PONG is received', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    // @ts-expect-error accessing private field for testing
    const worker = manager.worker as MockWorker;
    const terminateSpy = vi.spyOn(worker, 'terminate');
    
    // Advance time to trigger PING
    vi.advanceTimersByTime(30000);
    
    // Simulate PONG
    worker.onmessage?.(new MessageEvent('message', { data: { type: 'PONG' } }));
    
    // Advance time past timeout
    vi.advanceTimersByTime(5000);
    
    expect(terminateSpy).not.toHaveBeenCalled();
  });
});
