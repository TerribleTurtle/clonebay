import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LegacyDomainNotice } from '../../src/components/LegacyDomainNotice';
import { useDataWipe } from '../../src/hooks/useDataWipe';
import { SITE_URL } from '../../src/config/constants';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/settings'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('../../src/hooks/useDataWipe', () => ({
  useDataWipe: vi.fn(),
}));

describe('LegacyDomainNotice', () => {
  const mockHandleWipeData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDataWipe).mockReturnValue({
      handleWipeData: mockHandleWipeData,
    });
  });

  it('renders heading "Clone Bay has moved"', () => {
    render(<LegacyDomainNotice />);
    expect(
      screen.getByRole('heading', { name: /Clone Bay has moved/i })
    ).toBeInTheDocument();
  });

  it('renders link button to ${SITE_URL}${current pathname}', () => {
    render(<LegacyDomainNotice />);
    const linkButton = screen.getByRole('link', {
      name: new RegExp(`${SITE_URL}/settings`, 'i'),
    });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('href', `${SITE_URL}/settings`);
  });

  it('renders explanation that browser storage is per-domain and login is required', () => {
    render(<LegacyDomainNotice />);
    expect(
      screen.getByText(/browser storage/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/per-domain|per domain/i)
    ).toBeInTheDocument();
  });

  it('renders recommendation to revoke old app grants with official CCP link', () => {
    render(<LegacyDomainNotice />);
    const revokeLink = screen.getByRole('link', {
      name: /https:\/\/developers\.eveonline\.com\/authorized-apps/i,
    });
    expect(revokeLink).toBeInTheDocument();
    expect(revokeLink).toHaveAttribute(
      'href',
      'https://developers.eveonline.com/authorized-apps'
    );
  });

  it('calls handleWipeData on wipe button click and transitions to confirmation state', async () => {
    mockHandleWipeData.mockResolvedValue(undefined);

    render(<LegacyDomainNotice />);
    const wipeButton = screen.getByRole('button', {
      name: /Wipe this browser's data on the old site/i,
    });
    expect(wipeButton).toBeInTheDocument();

    fireEvent.click(wipeButton);

    expect(mockHandleWipeData).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(
        screen.getByText(/wiped successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('renders notice instead of children when on legacy host', () => {
    // Set hostname to legacy domain
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'clonebay.app',
    });

    render(
      <LegacyDomainNotice>
        <div data-testid="app-content">Normal App</div>
      </LegacyDomainNotice>
    );

    expect(
      screen.getByRole('heading', { name: /Clone Bay has moved/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('renders children instead of notice when not on legacy host', () => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      hostname: 'clonebay.terribleturtles.dev',
    });

    render(
      <LegacyDomainNotice>
        <div data-testid="app-content">Normal App</div>
      </LegacyDomainNotice>
    );

    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Clone Bay has moved/i })
    ).not.toBeInTheDocument();
  });
});
