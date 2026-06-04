import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlobalHeader } from '../../src/components/GlobalHeader';

describe('GlobalHeader', () => {
  it('renders title and navigation links', () => {
    render(<GlobalHeader />);
    expect(screen.getByRole('heading', { name: /EVE-DASH \|\| Command Center/i })).toBeInTheDocument();
    
    expect(screen.getByRole('link', { name: /\[ SETTINGS \]/i })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('link', { name: /\[ OPSEC & TRUST \]/i })).toHaveAttribute('href', '/trust');
    expect(screen.getByRole('link', { name: /\[ DEBUG TERMINAL \]/i })).toHaveAttribute('href', '/debug');
  });
});
