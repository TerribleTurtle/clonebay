import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBoundStore } from "../../src/store/useBoundStore";

describe('useBoundStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store before each test
    useBoundStore.setState({ characters: {}, lastPolled: null });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with an empty character dictionary', () => {
    const state = useBoundStore.getState();
    expect(state.characters).toEqual({});
  });

  it('adds a new character with partial status payload and defaults the rest to Offline', () => {
    const { updateCharacterStatus } = useBoundStore.getState();
    
    updateCharacterStatus('char-1', { skills: 'Green' });
    
    const state = useBoundStore.getState();
    expect(state.characters['char-1']).toEqual({
      skills: 'Green',
      industry: 'Offline',
      pi: 'Offline',
      walletStatus: 'Offline',
      mailStatus: 'Offline',
      cloneStatus: 'Offline',
      locationStatus: 'Offline',
      structureStatus: 'Offline',
      warStatus: 'Offline'
    });
  });

  it('updates an existing character status without overwriting unprovided fields', () => {
    useBoundStore.getState().updateCharacterStatus('char-1', { skills: 'Green', industry: 'Green', pi: 'Red' });
    
    // Now update just PI
    useBoundStore.getState().updateCharacterStatus('char-1', { pi: 'Green' });

    const state = useBoundStore.getState();
    expect(state.characters['char-1']).toEqual({
      skills: 'Green',
      industry: 'Green',
      pi: 'Green',
      walletStatus: 'Offline',
      mailStatus: 'Offline',
      cloneStatus: 'Offline',
      locationStatus: 'Offline',
      structureStatus: 'Offline',
      warStatus: 'Offline'
    });
  });
});


