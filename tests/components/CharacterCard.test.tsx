import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterCard } from '../../src/components/CharacterCard';

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

import { useCharacterStore } from '../../src/store/useCharacterStore';

describe('CharacterCard', () => {
  let mockRemoveAndReload: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockRemoveAndReload = CharacterService.removeAndReload as unknown as ReturnType<typeof vi.fn>;
    
    localStorage.clear();
    useCharacterStore.setState({ characters: {}, lastPolled: null });
    useCharacterStore.getState().updateCharacterStatus('char-1', {
      name: 'Test Pilot',
      locationName: 'Jita IV - Moon 4',
      isk: 1000000,
      totalSp: 5000000,
      unallocatedSp: 100000,
      clones: { jump_clones: [{ jump_clone_id: 1, location_id: 123, location_type: 'station', implants: [1, 2] }] },
      fatigue: { jump_fatigue_expire_date: new Date('2026-06-05T00:00:00Z').toISOString() },
      transactions: { count: 5 },
      mail: { total_unread_count: 2 },
      contracts: { count: 3 },
      marketOrders: { count: 10 },
      ship: { ship_item_id: 1, ship_name: 'Test Ship', ship_type_id: 123 },
      skills: 'Green',
      industry: 'Yellow',
      pi: 'Red',
      walletStatus: 'Green',
      locationStatus: 'Green',
      mailStatus: 'Yellow',
      cloneStatus: 'Green'
    });
  });

  afterEach(() => {
    useCharacterStore.setState({ characters: {}, lastPolled: null });
  });

  it('renders character details correctly', () => {
    render(<CharacterCard characterId="char-1" />);
    
    expect(screen.getByText('Test Pilot')).toBeInTheDocument();
    expect(screen.getByText('[Jita IV - Moon 4]')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
    expect(screen.getByText('5,100,000')).toBeInTheDocument(); // total + unallocated
    expect(screen.getByText('Test Ship')).toBeInTheDocument();
  });

  it('calls removeAndReload when remove button is clicked', async () => {
    render(<CharacterCard characterId="char-1" />);
    const removeBtn = screen.getByTitle('Remove Character');
    fireEvent.click(removeBtn);
    
    await waitFor(() => {
      expect(mockRemoveAndReload).toHaveBeenCalledWith('char-1');
    });
  });

  it('renders null if character does not exist', () => {
    const { container } = render(<CharacterCard characterId="char-2" />);
    expect(container).toBeEmptyDOMElement();
  });
});
