import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useEsiWorkerManager } from '../../src/components/useEsiWorkerManager';
import { WorkerManager } from '../../src/workers/WorkerManager';

vi.mock('../../src/workers/WorkerManager', () => ({
  WorkerManager: {
    getInstance: vi.fn()
  }
}));

describe('useEsiWorkerManager', () => {
  it('initializes worker and subscribes', () => {
    const mockSubscribe = vi.fn();
    const mockStart = vi.fn();
    const mockStop = vi.fn();
    (WorkerManager.getInstance as unknown).mockReturnValue({
      subscribe: mockSubscribe,
      start: mockStart,
      stop: mockStop
    });

    const { unmount } = renderHook(() => useEsiWorkerManager());
    
    expect(WorkerManager.getInstance).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();

    unmount();
    expect(mockStop).toHaveBeenCalled();
  });
});

