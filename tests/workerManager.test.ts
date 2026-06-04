import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { WorkerManager } from '../src/workers/WorkerManager';
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
  
  static latestInstance: MockWorker | null = null;

  constructor(_stringUrl: string | URL) {
    MockWorker.latestInstance = this;
  }
  
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
});

afterEach(() => {
  const manager = WorkerManager.getInstance();
  manager.stop();
  vi.useRealTimers();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('WorkerManager', () => {
  it('should restart worker with exponential backoff on crash', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    const worker = MockWorker.latestInstance!;
    
    // Simulate crash
    expect(() => {
      worker.onerror?.(new ErrorEvent('error'));
    }).toThrow();
    
    expect(logger.error).toHaveBeenCalledWith('WorkerManager: Worker crashed', expect.any(ErrorEvent));
    
    // Advance timers by backoff 1 (max 2000 due to jitter)
    vi.advanceTimersByTime(2000);
    
    const worker2 = MockWorker.latestInstance!;
    expect(worker2).not.toBe(worker);
    
    // Crash again
    expect(() => {
      worker2.onerror?.(new ErrorEvent('error'));
    }).toThrow();
    
    // Advance by backoff 2 (max 3000)
    vi.advanceTimersByTime(3000);
    
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('(Attempt 2)'));
  });

  it('should terminate worker and restart on missed PONG', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    const worker = MockWorker.latestInstance!;
    const terminateSpy = vi.spyOn(worker, 'terminate');
    
    // Advance time to trigger PING
    vi.advanceTimersByTime(30000);
    
    // Advance time to trigger PONG timeout
    expect(() => {
      vi.advanceTimersByTime(5000);
    }).toThrow('WorkerManager: Missed PONG, terminating worker');
    
    expect(logger.error).toHaveBeenCalledWith('WorkerManager: Missed PONG, terminating worker');
    expect(terminateSpy).toHaveBeenCalled();
  });

  it('should not terminate if PONG is received', () => {
    const manager = WorkerManager.getInstance();
    manager.start();
    
    const worker = MockWorker.latestInstance!;
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

