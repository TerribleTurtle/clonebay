import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterService } from '../../src/services/CharacterService';
import * as AuthRepository from '../../src/auth/AuthRepository';
import { useCharacterStore } from '../../src/store/useCharacterStore';

vi.mock('../../src/auth/AuthRepository', () => ({
  removeCharacter: vi.fn()
}));

describe('CharacterService', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location.reload
    // @ts-expect-error - overriding properties
    delete window.location;
    window.location = { ...originalLocation, reload: vi.fn() } as unknown;

    useCharacterStore.setState({
      characters: {
        'char-1': { id: 'char-1', name: 'Char 1' } as unknown
      }
    });
  });

  afterEach(() => {
    // @ts-expect-error - overriding properties
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should verify that removeAndReload correctly triggers repository wipes and state deletion', async () => {
    vi.mocked(AuthRepository.removeCharacter).mockResolvedValue();

    await CharacterService.removeAndReload('char-1');

    expect(AuthRepository.removeCharacter).toHaveBeenCalledWith('char-1');
    expect(useCharacterStore.getState().characters['char-1']).toBeUndefined();
    expect(window.location.reload).toHaveBeenCalled();
  });
});


