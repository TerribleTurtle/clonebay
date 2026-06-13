import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CharacterStatusBoard } from '../../../src/components/ui/CharacterStatusBoard';

describe('CharacterStatusBoard', () => {
  it('renders indicators correctly based on status', () => {
    const statuses = {
      skill: 'green' as const,
      pi: 'yellow' as const,
      indy: 'red' as const,
      mail: 'offline' as const,
      war: 'green' as const,
    };
    
    render(<CharacterStatusBoard statuses={statuses} alerts={{ indy: ['No jobs running'] }} />);
    
    const skillLabel = screen.getByText('SKILL');
    expect(skillLabel.closest('div')).toHaveClass('text-status-green');
    
    const piLabel = screen.getByText('PI');
    expect(piLabel.closest('div')).toHaveClass('text-status-yellow');
    
    const indyLabel = screen.getByText('INDY');
    expect(indyLabel.closest('div')).toHaveClass('text-status-red');

    const mailLabel = screen.getByText('MAIL');
    expect(mailLabel.closest('div')).toHaveClass('opacity-50'); // offline class
  });

  it('hides indicators when visibility is toggled off', () => {
    const statuses = {
      skill: 'green' as const,
      pi: 'green' as const,
      indy: 'green' as const,
      mail: 'green' as const,
      war: 'green' as const,
    };
    const visibility = { trackSkills: false, trackPi: true, trackIndy: true, trackMail: true, trackWar: true };
    render(<CharacterStatusBoard statuses={statuses} visibility={visibility} />);
    
    expect(screen.queryByText('SKILL')).not.toBeInTheDocument();
    expect(screen.getByText('PI')).toBeInTheDocument();
  });
});
