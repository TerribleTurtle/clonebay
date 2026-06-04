import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { BroadcastLeader, initLeaderElection } from '../src/utils/broadcastLeader';

describe('BroadcastLeader', () => {
  let onBecomeMaster: Mock;
  let onBecomeSlave: Mock;
  let onDataUpdate: Mock;
  let leader: BroadcastLeader<unknown>;

  let mockPostMessage: Mock;
  let mockClose: Mock;
  let mockOnMessage: ((ev: MessageEvent) => void) | null;

  beforeEach(() => {
    vi.useFakeTimers();
    onBecomeMaster = vi.fn();
    onBecomeSlave = vi.fn();
    onDataUpdate = vi.fn();

    mockPostMessage = vi.fn();
    mockClose = vi.fn();
    mockOnMessage = null;

    vi.stubGlobal('BroadcastChannel', class {
      name: string;
      constructor(name: string) {
        this.name = name;
      }
      postMessage(msg: unknown) {
        mockPostMessage(msg);
      }
      close() {
        mockClose();
      }
      set onmessage(fn: ((ev: MessageEvent) => void) | null) {
        mockOnMessage = fn;
      }
      get onmessage(): ((ev: MessageEvent) => void) | null {
        return mockOnMessage;
      }
    });
  });

  afterEach(() => {
    if (leader) {
      leader.terminate();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should become master after election timeout', () => {
    leader = initLeaderElection({
      onBecomeMaster,
      onBecomeSlave,
      onDataUpdate,
    });

    vi.advanceTimersByTime(500);

    expect(onBecomeMaster).toHaveBeenCalledTimes(1);
    expect(onBecomeSlave).not.toHaveBeenCalled();
  });

  it('should become slave if it receives a heartbeat from another master', () => {
    leader = initLeaderElection({
      onBecomeMaster,
      onBecomeSlave,
      onDataUpdate,
    });

    if (mockOnMessage) {
      mockOnMessage(new MessageEvent('message', {
        data: { type: 'HEARTBEAT', tabId: 'other-tab-id' }
      }));
    }

    expect(onBecomeSlave).toHaveBeenCalledTimes(1);
    expect(onBecomeMaster).not.toHaveBeenCalled();
  });

  it('should only broadcast updates if it is the master', () => {
    leader = initLeaderElection({
      onBecomeMaster,
      onBecomeSlave,
      onDataUpdate,
    });

    // Before becoming master
    leader.broadcastEsiUpdate({ test: 'data' });

    expect(mockPostMessage).not.toHaveBeenCalledWith({ type: 'DATA_UPDATE', payload: { test: 'data' } });

    // Now become master
    vi.advanceTimersByTime(500);
    expect(onBecomeMaster).toHaveBeenCalledTimes(1);

    leader.broadcastEsiUpdate({ test: 'data' });
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'DATA_UPDATE', payload: { test: 'data' } });
  });

  it('should trigger onDataUpdate when slave receives DATA_UPDATE', () => {
    leader = initLeaderElection({
      onBecomeMaster,
      onBecomeSlave,
      onDataUpdate,
    });

    // Become slave
    if (mockOnMessage) {
      mockOnMessage(new MessageEvent('message', {
        data: { type: 'HEARTBEAT', tabId: 'other-tab-id' }
      }));
    }

    expect(onBecomeSlave).toHaveBeenCalledTimes(1);

    if (mockOnMessage) {
      mockOnMessage(new MessageEvent('message', {
        data: { type: 'DATA_UPDATE', payload: { payloadData: 123 } }
      }));
    }

    expect(onDataUpdate).toHaveBeenCalledWith({ payloadData: 123 });
  });
});


