import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import LoginPage from '../../../src/app/auth/login/page';

import * as Pkce from '../../../src/auth/pkce';
import * as PkceStorage from '../../../src/utils/PkceStorage';
import * as EsiAuth from '../../../src/auth/esiAuth';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('LoginPage', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '', origin: 'http://localhost:3000', assign: vi.fn(), replace: vi.fn() },
      writable: true
    });

    // Set process.env
    process.env['NEXT_PUBLIC_EVE_CLIENT_ID'] = 'test-client-id';
    process.env['NEXT_PUBLIC_EVE_CALLBACK_URL'] = 'http://localhost:3000/auth/callback';

    // Spies
    vi.spyOn(PkceStorage, 'setPkceState');
    vi.spyOn(PkceStorage, 'setCodeVerifier');
    vi.spyOn(Pkce, 'generateRandomString').mockReturnValue('mock-random-string');
    vi.spyOn(Pkce, 'generateCodeChallenge').mockResolvedValue('mock-challenge');
    vi.spyOn(EsiAuth, 'buildEsiAuthUrl');
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  it('generates PKCE challenge, stores state/verifier, and redirects to EVE SSO', async () => {
    render(<LoginPage />);

    await waitFor(() => {
      // It should store state and verifier
      expect(PkceStorage.setPkceState).toHaveBeenCalledWith('mock-random-string');
      expect(PkceStorage.setCodeVerifier).toHaveBeenCalledWith('mock-random-string');

      // It should redirect to the correct auth url
      expect(window.location.href).toContain('test-client-id');
      expect(window.location.href).toContain('response_type=code');
      expect(window.location.href).toContain('redirect_uri=');
      expect(window.location.href).toContain('code_challenge=mock-challenge');
      expect(window.location.href).toContain('code_challenge_method=S256');
    });
  });
});
