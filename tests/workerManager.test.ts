import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

class MockWorker {
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  onerror: ((ev: ErrorEvent) => unknown) | null = null;
  
  static latestInstance: MockWorker | null = null;

  constructor() {
    MockWorker.latestInstance = this;
  }
  
  postMessage = vi.fn();
  terminate = vi.fn();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  MockWorker.latestInstance = null;
});

afterEach(() => {
  const manager = WorkerManager.getInstance();
  manager.stop();
  // @ts-expect-error Reset singleton for isolated tests
  WorkerManager.instance = undefined;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('WorkerManager', () => {
  it('should restart worker with exponential backoff on crash', () => {
    const manager = WorkerManager.getInstance(() => new MockWorker() as unknown as Worker);
    manager.start();
    
    const worker = MockWorker.latestInstance!;
    
    // Simulate crash
    worker.onerror?.(new ErrorEvent('error'));
    
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('WorkerManager: Worker crashed'), expect.any(Object));
    
    // Advance timers by backoff 1 (max 2000 due to jitter)
    vi.advanceTimersByTime(2000);
    
    const worker2 = MockWorker.latestInstance!;
    expect(worker2).not.toBe(worker);
    
    // Crash again
    worker2.onerror?.(new ErrorEvent('error'));
    
    // Advance by backoff 2 (max 3000)
    vi.advanceTimersByTime(3000);
    
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('(Attempt 2)'));
  });

  it('should terminate worker and restart on missed PONG', () => {
    const manager = WorkerManager.getInstance(() => new MockWorker() as unknown as Worker);
    manager.start();
    
    const worker = MockWorker.latestInstance!;
    
    // Advance time to trigger PING
    vi.advanceTimersByTime(30000);
    
    // Advance time to trigger PONG timeout
    expect(() => {
      vi.advanceTimersByTime(5000);
    }).toThrow('WorkerManager: Missed PONG, terminating worker');
    
    expect(logger.error).toHaveBeenCalledWith('WorkerManager: Missed PONG, terminating worker');
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('should not terminate if PONG is received', () => {
    const manager = WorkerManager.getInstance(() => new MockWorker() as unknown as Worker);
    manager.start();
    
    const worker = MockWorker.latestInstance!;
    
    // Advance time to trigger PING
    vi.advanceTimersByTime(30000);
    
    // Simulate PONG
    worker.onmessage?.(new MessageEvent('message', { data: { type: 'PONG' } }));
    
    // Advance time past timeout
    vi.advanceTimersByTime(5000);
    
    expect(worker.terminate).not.toHaveBeenCalled();
  });
});
