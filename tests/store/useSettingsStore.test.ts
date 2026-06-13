import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore, clearAllStorage } from '../../src/store/useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('initializes with defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.walletYellowThreshold).toBe(500000000);
    expect(state.walletRedThreshold).toBe(100000000);
  });

  it('updates thresholds', () => {
    useSettingsStore.getState().setWalletYellowThreshold(200);
    useSettingsStore.getState().setWalletRedThreshold(100);

    const state = useSettingsStore.getState();
    expect(state.walletYellowThreshold).toBe(200);
    expect(state.walletRedThreshold).toBe(100);
  });

  it('clearAllStorage clears local and session storage', () => {
    const localSpy = vi.spyOn(Storage.prototype, 'clear');
    clearAllStorage();
    expect(localSpy).toHaveBeenCalledTimes(2); // once for local, once for session
  });
});
