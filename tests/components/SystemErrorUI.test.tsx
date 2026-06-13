import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SystemErrorUI } from '../../src/components/SystemErrorUI';

describe('SystemErrorUI', () => {
  it('renders the error message and provides a retry button', () => {
    const error = new Error('Test critical failure');
    const mockReset = vi.fn();

    render(<SystemErrorUI error={error} reset={mockReset} />);

    expect(screen.getByText(/Test critical failure/)).toBeInTheDocument();
    
    const retryButton = screen.getByRole('button', { name: /Reboot/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
