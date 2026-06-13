import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCharacterStore } from "../../src/store/useCharacterStore";

describe('useCharacterStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store before each test
    useCharacterStore.setState({ characters: {}, lastPolled: null });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with an empty character dictionary', () => {
    const state = useCharacterStore.getState();
    expect(state.characters).toEqual({});
  });

  it('adds a new character with partial status payload and defaults the rest to Offline', () => {
    const { updateCharacterStatus } = useCharacterStore.getState();
    
    updateCharacterStatus('char-1', { skills: 'Green' });
    
    const state = useCharacterStore.getState();
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
    useCharacterStore.getState().updateCharacterStatus('char-1', { skills: 'Green', industry: 'Green', pi: 'Red' });
    
    // Now update just PI
    useCharacterStore.getState().updateCharacterStatus('char-1', { pi: 'Green' });

    const state = useCharacterStore.getState();
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


