import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/utils/logger';
import { useLogStore } from '../../src/store/useLogStore';

describe('logger', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalPostMessage: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    originalPostMessage = global.postMessage;
    (global as Record<string, unknown>)['postMessage'] = mockPostMessage;
    
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    useLogStore.setState({ logs: [] });
  });

  afterEach(() => {
    (global as Record<string, unknown>)['postMessage'] = originalPostMessage;
    vi.restoreAllMocks();
  });

  it('should format log and add to store in main thread', () => {
    logger.info('Test message', { foo: 'bar' });
    
    const logs = useLogStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(expect.objectContaining({
      level: 'info',
      message: 'Test message',
      source: 'main',
      data: { foo: 'bar' }
    }));
  });

  it('should handle uncloneable object fallback', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = Symbol('test');
    
    logger.info('Test uncloneable', obj);
    
    const logs = useLogStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0]).toEqual(expect.objectContaining({
      data: '[Uncloneable Object]'
    }));
  });

  it('should use postMessage in worker context', () => {
    // Temporarily hide document to simulate worker
    const originalDocument = global.document;
    delete (global as Record<string, unknown>)['document'];

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
    (global as Record<string, unknown>)['document'] = originalDocument;
  });
});

