import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CharacterSettingsDialog } from '../../../src/components/ui/CharacterSettingsDialog';
import { useCharacterConfigStore } from '../../../src/store/useCharacterConfigStore';

describe('CharacterSettingsDialog', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CharacterSettingsDialog characterId="char-1" isOpen={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders and defaults to General tab', () => {
    useCharacterConfigStore.setState({ configs: {} });
    
    render(
      <CharacterSettingsDialog characterId="char-1" isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByRole('heading', { name: /Settings \/\/ char-1/i })).toBeInTheDocument();
    expect(screen.getByText('General Configuration')).toBeInTheDocument();
  });

  it('switches tabs and toggles visibility', () => {
    const mockOnClose = vi.fn();
    useCharacterConfigStore.setState({
      configs: { 123: { visibility: { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true, trackWar: true }, overrides: {} } }
    });
    render(
      <CharacterSettingsDialog characterId="123" isOpen={true} onClose={mockOnClose} />
    );
    
    // Switch to Visibility Tab
    fireEvent.click(screen.getByRole('button', { name: /Visibility/i }));
    expect(screen.getByText('Module Visibility')).toBeInTheDocument();
    
    // Toggle SKILL_TRACKING
    const skillCheckbox = screen.getByLabelText('SKILL_TRACKING');
    expect(skillCheckbox).toBeInTheDocument();
    fireEvent.click(skillCheckbox);
    
    const config = useCharacterConfigStore.getState().configs[123];
    expect(config?.visibility.trackSkills).toBe(false);
  });
});
