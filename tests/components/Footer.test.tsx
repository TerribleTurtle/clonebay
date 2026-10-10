import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '../../src/components/Footer';
import { CCP_LEGAL_NOTICE, REPO_URL, UNOFFICIAL_NOTICE } from '../../src/config/constants';

describe('Footer', () => {
  it('renders unofficial fan project notice and navigation links', () => {
    render(<Footer />);

    expect(screen.getByText(UNOFFICIAL_NOTICE)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\[ PRIVACY \]/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /\[ TRUST & LEGAL \]/i })).toHaveAttribute('href', '/trust');
    expect(screen.getByRole('link', { name: /\[ GITHUB \]/i })).toHaveAttribute('href', REPO_URL);
    expect(screen.getByText(CCP_LEGAL_NOTICE)).toBeInTheDocument();
  });
});
