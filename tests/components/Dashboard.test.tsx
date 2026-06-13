import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Dashboard } from '../../src/components/Dashboard';
import { SettingsRepository } from '../../src/repositories/SettingsRepository';
import { useCharacterStore } from '../../src/store/useCharacterStore';

// Mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../../src/hooks/useEsiWorkerManager', () => ({
  useEsiWorkerManager: vi.fn(),
}));

vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Dashboard', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    useCharacterStore.setState({ characters: {}, lastPolled: null });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    useCharacterStore.setState({ characters: {}, lastPolled: null });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders initial state without characters', () => {
    render(<Dashboard />);
    expect(screen.getByText(/NO CLONES CONNECTED/i)).toBeInTheDocument();
  });

  it('renders characters', () => {
    useCharacterStore.getState().updateCharacterStatus('char-1', { name: 'Alice' });
    useCharacterStore.getState().updateCharacterStatus('char-2', { name: 'Bob' });

    render(<Dashboard />);
    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bob' })).toBeInTheDocument();
  });

  it('toggles mock mode', () => {
    render(<Dashboard />);
    const btn = screen.getByRole('button', { name: /Mock Mode: OFF/i });
    fireEvent.click(btn);
    
    // Meaningful integration assertion: the store clears, local storage is updated, and reload is called
    expect(SettingsRepository.getMockMode()).toBe(true);
    expect(useCharacterStore.getState().characters).toEqual({});
    expect(window.location.reload).toHaveBeenCalled();
  });
});
