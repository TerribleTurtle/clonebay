import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterService } from '../../src/services/CharacterService';
import * as AuthRepository from '../../src/auth/AuthRepository';
import { useBoundStore, DEFAULT_OFFLINE_STATUS, type CharacterStatus } from '../../src/store/useBoundStore';

vi.mock('../../src/auth/AuthRepository', () => ({
  removeCharacter: vi.fn()
}));

describe('CharacterService', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, reload: vi.fn() }
    });

    useBoundStore.setState({
      characters: {
        'char-1': { 
          name: 'Char 1',
          ...DEFAULT_OFFLINE_STATUS
        } as CharacterStatus
      }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation
    });
    vi.clearAllMocks();
  });

  it('should verify that removeAndReload correctly triggers repository wipes and state deletion', async () => {
    vi.mocked(AuthRepository.removeCharacter).mockResolvedValue();

    await CharacterService.removeAndReload('char-1');

    expect(AuthRepository.removeCharacter).toHaveBeenCalledWith('char-1');
    expect(useBoundStore.getState().characters['char-1']).toBeUndefined();
    expect(window.location.reload).toHaveBeenCalled();
  });
});


