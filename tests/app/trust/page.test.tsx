import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TrustPage from '../../../src/app/trust/page';
import { useDataWipe } from '../../../src/hooks/useDataWipe';

vi.mock('../../../src/hooks/useDataWipe', () => ({
  useDataWipe: vi.fn()
}));

describe('TrustPage', () => {
  it('calls handleWipeData on Execute Terminal Wipe', () => {
    const mockHandleWipeData = vi.fn();
    (useDataWipe as ReturnType<typeof vi.fn>).mockReturnValue({ handleWipeData: mockHandleWipeData });

    render(<TrustPage />);
    const wipeBtn = screen.getByRole('button', { name: /Execute Terminal Wipe/i });
    fireEvent.click(wipeBtn);

    expect(mockHandleWipeData).toHaveBeenCalledWith(expect.stringContaining('Are you sure?'));
  });
});

