import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../../src/store/useCharacterStore';

describe('useCharacterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCharacterStore.setState({ characters: {} });
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
    });
  });

  it('updates an existing character status without overwriting unprovided fields', () => {
    const { updateCharacterStatus } = useCharacterStore.getState();
    
    updateCharacterStatus('char-1', { skills: 'Green', industry: 'Yellow' });
    updateCharacterStatus('char-1', { industry: 'Green', pi: 'Red' });
    
    const state = useCharacterStore.getState();
    expect(state.characters['char-1']).toEqual({
      skills: 'Green',
      industry: 'Green',
      pi: 'Red',
    });
  });
});
