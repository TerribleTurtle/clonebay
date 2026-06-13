import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SettingsPage from '../../../src/app/settings/page';
import { useDataWipe } from '../../../src/hooks/useDataWipe';

vi.mock('../../../src/hooks/useDataWipe', () => ({
  useDataWipe: vi.fn()
}));

describe('SettingsPage', () => {
  it('calls handleWipeData on Initiate Total Local Data Wipe', () => {
    const mockHandleWipeData = vi.fn();
    (useDataWipe as unknown).mockReturnValue({ handleWipeData: mockHandleWipeData });

    render(<SettingsPage />);
    const wipeBtn = screen.getByRole('button', { name: /Initiate Total Local Data Wipe/i });
    fireEvent.click(wipeBtn);

    expect(mockHandleWipeData).toHaveBeenCalledWith(expect.stringContaining('WARNING: This will wipe all SSO tokens and ESI cache.'));
  });
});

