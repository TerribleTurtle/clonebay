import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '../../../../src/app/auth/login/page';
import { ESI_SCOPES } from '../../../../src/auth/esiAuth';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock('../../../../src/auth/AuthRepository', () => ({
  setPkceState: vi.fn(),
  setCodeVerifier: vi.fn()
}));

describe('LoginPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetAllMocks();
    delete (window as unknown as { location: unknown }).location;
    window.location = { ...originalLocation, href: '' } as unknown as string & Location;
    vi.stubEnv('NEXT_PUBLIC_EVE_CLIENT_ID', 'test-client-id');
  });

  afterEach(() => {
    // @ts-expect-error - overriding properties
    window.location = originalLocation;
    vi.unstubAllEnvs();
  });

  it('redirects to EVE SSO with correct scopes', async () => {
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(window.location.href).toContain('https://login.eveonline.com/v2/oauth/authorize');
    });

    const url = new URL(window.location.href);
    const scopeParam = url.searchParams.get('scope');
    expect(scopeParam).toBe(ESI_SCOPES.join(' '));
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
  });

  it('renders error if NEXT_PUBLIC_EVE_CLIENT_ID is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_EVE_CLIENT_ID', '');
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Missing NEXT_PUBLIC_EVE_CLIENT_ID/)).toBeInTheDocument();
    });
  });
});


