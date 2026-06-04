import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dashboard } from '../../src/components/Dashboard';

import { CharacterService } from '../../src/services/CharacterService';
import { SettingsRepository } from '../../src/repositories/SettingsRepository';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../src/components/useEsiWorkerManager', () => ({
  useEsiWorkerManager: vi.fn(),
}));

vi.mock('../../src/components/CharacterCard', () => ({
  CharacterCard: ({ characterId }: { characterId: string }) => <div data-testid={`char-row-${characterId}`}>{characterId}</div>,
}));

vi.mock('../../src/services/CharacterService', () => ({
  CharacterService: {
    toggleMockMode: vi.fn(),
  }
}));

vi.mock('../../src/repositories/SettingsRepository', () => ({
  SettingsRepository: {
    getMockMode: vi.fn().mockReturnValue(false),
  }
}));

vi.mock('../../src/store/useCharacterStore', () => {
  const storeState = {
    characters: {},
  };

  const useCharacterStore = vi.fn((selector) => {
    // For shallow comparison bypass
    if (selector.name === 'useShallow' || selector.toString().includes('Object.keys')) {
      return Object.keys(storeState.characters);
    }
    return selector(storeState);
  });
  
  (useCharacterStore as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).getState = () => storeState;
  
  return { useCharacterStore };
});

describe('Dashboard', () => {
  let mockToggleMockMode: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let useCharacterStoreMock: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (SettingsRepository.getMockMode as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    mockToggleMockMode = CharacterService.toggleMockMode as unknown as ReturnType<typeof vi.fn>;
    
    useCharacterStoreMock = await import('../../src/store/useCharacterStore');
    const storeState = {
      characters: {},
    };

    useCharacterStoreMock.useCharacterStore.mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      try {
        const result = selector(storeState);
        return result;
      } catch {
        return Object.keys(storeState.characters);
      }
    });
    useCharacterStoreMock.useCharacterStore.getState = () => storeState;
  });

  it('renders initial state without characters', () => {
    render(<Dashboard />);
    expect(screen.getByText(/NO CLONES CONNECTED/i)).toBeInTheDocument();
  });

  it('renders characters', () => {
    const storeState = {
      characters: {
        'char-1': { name: 'Alice' },
        'char-2': { name: 'Bob' },
      },
    };
    
    useCharacterStoreMock.useCharacterStore.mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      if (typeof selector === 'function') {
        const str = selector.toString();
        if (str.includes('Object.keys')) return Object.keys(storeState.characters);
      }
      return selector(storeState);
    });
    useCharacterStoreMock.useCharacterStore.getState = () => storeState;

    render(<Dashboard />);
    expect(screen.getByTestId('char-row-char-1')).toBeInTheDocument();
    expect(screen.getByTestId('char-row-char-2')).toBeInTheDocument();
  });

  it('toggles mock mode', () => {
    const storeState = {
      characters: {},
    };
    
    useCharacterStoreMock.useCharacterStore.mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      if (typeof selector === 'function' && selector.toString().includes('Object.keys')) {
        return Object.keys(storeState.characters);
      }
      return selector(storeState);
    });
    useCharacterStoreMock.useCharacterStore.getState = () => storeState;

    render(<Dashboard />);
    const btn = screen.getByRole('button', { name: /Mock Mode: OFF/i });
    fireEvent.click(btn);
    expect(mockToggleMockMode).toHaveBeenCalledWith(false);
  });
});


