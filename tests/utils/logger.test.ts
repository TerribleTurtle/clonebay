import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger';
import { useLogStore } from '../../src/store/useLogStore';

vi.mock('../../src/store/useLogStore', () => ({
  useLogStore: {
    getState: vi.fn(() => ({
      addLog: vi.fn()
    }))
  }
}));

describe('logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalPostMessage: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    originalPostMessage = global.postMessage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as unknown).postMessage = mockPostMessage;
    
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as unknown).postMessage = originalPostMessage;
    vi.restoreAllMocks();
  });

  it('should format log and add to store in main thread', () => {
    const addLogMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useLogStore.getState).mockReturnValue({ addLog: addLogMock } as unknown);
    
    logger.info('Test message', { foo: 'bar' });
    
    expect(addLogMock).toHaveBeenCalledWith(expect.objectContaining({
      level: 'info',
      message: 'Test message',
      source: 'main',
      data: { foo: 'bar' }
    }));
  });

  it('should handle uncloneable object fallback', () => {
    const addLogMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useLogStore.getState).mockReturnValue({ addLog: addLogMock } as unknown);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = Symbol('test');
    
    logger.info('Test uncloneable', obj);
    
    expect(addLogMock).toHaveBeenCalledWith(expect.objectContaining({
      data: '[Uncloneable Object]'
    }));
  });

  it('should use postMessage in worker context', () => {
    // Temporarily hide document to simulate worker
    const originalDocument = global.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as unknown).document;

    logger.error('Worker error', new Error('test error'));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'WORKER_LOG',
      payload: expect.objectContaining({
        level: 'error',
        message: 'Worker error',
        source: 'worker',
        data: expect.objectContaining({
          name: 'Error',
          message: 'test error'
        })
      })
    });

    // Restore document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as unknown).document = originalDocument;
  });
});

