import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterRow } from '../../src/components/CharacterRow';

import { CharacterService } from '../../src/services/CharacterService';

// Mock zustand store and logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('../../src/services/CharacterService', () => ({
  CharacterService: {
    removeAndReload: vi.fn(),
  }
}));

vi.mock('../../src/store/useCharacterStore', () => {
  const storeState = {
    characters: {},
  };

  const useCharacterStore = vi.fn((selector) => {
    return selector(storeState);
  });
  
  return { useCharacterStore };
});

describe('CharacterRow', () => {
  let mockRemoveAndReload: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let useCharacterStoreMock: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockRemoveAndReload = CharacterService.removeAndReload as unknown as ReturnType<typeof vi.fn>;
    
    useCharacterStoreMock = await import('../../src/store/useCharacterStore');
    
    const storeState = {
      characters: {
        'char-1': {
          name: 'Test Pilot',
          locationName: 'Jita IV - Moon 4',
          isk: 1000000,
          totalSp: 5000000,
          unallocatedSp: 100000,
          clones: { jump_clones: [1, 2] },
          fatigue: { jump_fatigue_expire_date: new Date('2026-06-05T00:00:00Z').toISOString() },
          transactions: { count: 5 },
          mail: { total_unread_count: 2 },
          contracts: { count: 3 },
          marketOrders: { count: 10 },
          ship: { ship_name: 'Test Ship' },
          skills: 'Green',
          industry: 'Yellow',
          pi: 'Red',
          walletStatus: 'Green',
          locationStatus: 'Green',
          mailStatus: 'Yellow',
          cloneStatus: 'Green'
        }
      },
    };

    useCharacterStoreMock.useCharacterStore.mockImplementation((selector: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      return selector(storeState);
    });
  });

  it('renders character details correctly', () => {
    render(<CharacterRow characterId="char-1" />);
    
    expect(screen.getByText('Test Pilot')).toBeInTheDocument();
    expect(screen.getByText('[Jita IV - Moon 4]')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
    expect(screen.getByText('5,100,000')).toBeInTheDocument(); // total + unallocated
    expect(screen.getByText('100,000')).toBeInTheDocument(); // unallocated
    expect(screen.getByText('Test Ship')).toBeInTheDocument();
  });

  it('calls removeAndReload when remove button is clicked', async () => {
    render(<CharacterRow characterId="char-1" />);
    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);
    
    await waitFor(() => {
      expect(mockRemoveAndReload).toHaveBeenCalledWith('char-1');
    });
  });

  it('renders null if character does not exist', () => {
    const { container } = render(<CharacterRow characterId="char-2" />);
    expect(container).toBeEmptyDOMElement();
  });
});


