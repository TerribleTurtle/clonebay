import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CharacterMetrics } from '../../../src/components/ui/CharacterMetrics';

describe('CharacterMetrics', () => {
  it('renders all metrics with default values', () => {
    render(<CharacterMetrics />);
    expect(screen.getByText('Clones')).toBeInTheDocument();
    expect(screen.getByText('Fatigue')).toBeInTheDocument();
    expect(screen.getByText('Ship')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Mail')).toBeInTheDocument();
  });

  it('displays correct context data', () => {
    render(
      <CharacterMetrics 
        activeShip="Venture" 
        clonesCount={2} 
        maxClones={5} 
        activeOrders={10} 
        unreadMail={3} 
        fatigueTimer="01:00:00"
      />
    );
    expect(screen.getByText('Venture')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument();
  });
});
