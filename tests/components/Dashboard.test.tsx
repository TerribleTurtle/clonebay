import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

vi.mock('../../src/services/CharacterService', () => ({
  CharacterService: {
    toggleMockMode: vi.fn(),
    removeAndReload: vi.fn(),
  }
}));

vi.mock('../../src/repositories/SettingsRepository', () => ({
  SettingsRepository: {
    getMockMode: vi.fn().mockReturnValue(false),
  }
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { useCharacterStore } from '../../src/store/useCharacterStore';

describe('Dashboard', () => {
  let mockToggleMockMode: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (SettingsRepository.getMockMode as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    mockToggleMockMode = CharacterService.toggleMockMode as unknown as ReturnType<typeof vi.fn>;

    localStorage.clear();
    useCharacterStore.setState({ characters: {}, lastPolled: null });
  });

  afterEach(() => {
    useCharacterStore.setState({ characters: {}, lastPolled: null });
  });

  it('renders initial state without characters', () => {
    render(<Dashboard />);
    expect(screen.getByText(/NO CLONES CONNECTED/i)).toBeInTheDocument();
  });

  it('renders characters', () => {
    useCharacterStore.getState().updateCharacterStatus('char-1', { name: 'Alice' });
    useCharacterStore.getState().updateCharacterStatus('char-2', { name: 'Bob' });

    render(<Dashboard />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('toggles mock mode', () => {
    render(<Dashboard />);
    const btn = screen.getByRole('button', { name: /Mock Mode: OFF/i });
    fireEvent.click(btn);
    expect(mockToggleMockMode).toHaveBeenCalledWith(false);
  });
});

