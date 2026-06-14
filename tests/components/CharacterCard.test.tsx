import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CharacterCard } from '../../src/components/CharacterCard';

// Mock zustand store and logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));



import { useBoundStore } from '../../src/store/useBoundStore';

describe('CharacterCard', () => {
  let mockRemoveAndReload: import('vitest').Mock;
  
  beforeEach(() => {
    mockRemoveAndReload = vi.fn();
    
    localStorage.clear();
    useBoundStore.setState({ characters: {}, lastPolled: null });
    useBoundStore.getState().updateCharacterStatus('char-1', {
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
    useBoundStore.setState({ characters: {}, lastPolled: null });
    localStorage.clear();
  });

  it('renders character details correctly and applies correct styles', () => {
    render(<CharacterCard characterId="char-1" />);
    
    expect(screen.getByRole('heading', { name: 'Test Pilot' })).toBeInTheDocument();
    expect(screen.getByText('[Jita IV - Moon 4]')).toBeInTheDocument();
    
    // Test that the exact numbers match what's rendered
    expect(screen.getByLabelText('ISK: 1,000,000')).toBeInTheDocument();
    expect(screen.getByLabelText('Total SP: 5,100,000')).toBeInTheDocument();
    
    expect(screen.getByText('Test Ship')).toBeInTheDocument();

    // Verify Red/Yellow styles actually apply
    const skillLabel = screen.getByText('SKILL');
    expect(skillLabel.closest('div')).toHaveClass('text-status-green');

    const indyLabel = screen.getByText('INDY');
    expect(indyLabel.closest('div')).toHaveClass('text-status-yellow');

    const piLabel = screen.getByText('PI');
    expect(piLabel.closest('div')).toHaveClass('text-status-red');
  });

  it('calls onRemove when remove button is clicked', async () => {
    render(<CharacterCard characterId="char-1" onRemove={mockRemoveAndReload} />);
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

