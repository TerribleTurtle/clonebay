import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterConfigStore } from '../../src/store/useCharacterConfigStore';

describe('useCharacterConfigStore', () => {
  beforeEach(() => {
    useCharacterConfigStore.setState({ configs: {} });
  });

  it('initializes with an empty config', () => {
    expect(useCharacterConfigStore.getState().configs).toEqual({});
  });

  it('sets visibility with default fallback', () => {
    useCharacterConfigStore.getState().setVisibility(123, 'trackPi', false);
    
    const config = useCharacterConfigStore.getState().configs[123];
    expect(config).toBeDefined();
    expect(config!.visibility.trackPi).toBe(false);
    expect(config!.visibility.trackSkills).toBe(true); // Default
  });

  it('sets and clears overrides', () => {
    useCharacterConfigStore.getState().setOverride(123, 'walletRed', 5000);
    let config = useCharacterConfigStore.getState().configs[123];
    expect(config!.overrides.walletRed).toBe(5000);

    useCharacterConfigStore.getState().clearOverride(123, 'walletRed');
    config = useCharacterConfigStore.getState().configs[123];
    expect(config!.overrides.walletRed).toBeUndefined();
  });
});
