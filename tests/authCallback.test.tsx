// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CallbackPage from '../src/app/auth/callback/page';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams
}));

vi.mock('../src/utils/authStorage', () => ({
  addOrUpdateCharacter: vi.fn()
}));

function createFakeJWT(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signature = 'fake_signature';
  return `${header}.${body}.${signature}`;
}

describe('Auth Callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    global.fetch = vi.fn();
    process.env['NEXT_PUBLIC_EVE_CLIENT_ID'] = 'test-client-id';
  });

  it('CSRF state mismatch throws an explicit Error', async () => {
    mockSearchParams.set('code', 'test-code');
    mockSearchParams.set('state', 'wrong-state');
    
    sessionStorage.setItem('oauth_state', 'expected-state');
    sessionStorage.setItem('code_verifier', 'test-verifier');

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid state parameter (CSRF mismatch).')).toBeInTheDocument();
    });
  });

  it('manual atob base64 parser logic successfully extracts sub and name claims', async () => {
    mockSearchParams.set('code', 'test-code');
    mockSearchParams.set('state', 'correct-state');
    
    sessionStorage.setItem('oauth_state', 'correct-state');
    sessionStorage.setItem('code_verifier', 'test-verifier');

    const fakeJwt = createFakeJWT({
      sub: 'CHARACTER:EVE:123456789',
      name: 'Test Character'
    });

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        access_token: fakeJwt,
        refresh_token: 'fake-refresh'
      }), { status: 200 })
    );

    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    const { addOrUpdateCharacter } = await import('../src/utils/authStorage');
    expect(addOrUpdateCharacter).toHaveBeenCalledWith('CHARACTER:EVE:123456789', {
      accessToken: fakeJwt,
      refreshToken: 'fake-refresh',
      characterName: 'Test Character'
    });
  });

  it('correctly decodes unicode characters in JWT payload', async () => {
    mockSearchParams.set('code', 'test-code');
    mockSearchParams.set('state', 'correct-state');
    
    sessionStorage.setItem('oauth_state', 'correct-state');
    sessionStorage.setItem('code_verifier', 'test-verifier');

    // Encode payload natively to test the decoder's capability
    const payloadObj = {
      sub: 'CHARACTER:EVE:9999',
      name: 'Jön Dœ 🚀'
    };
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    // Proper utf-8 to base64 encoding for the test
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(payloadObj));
    const bodyStr = Array.from(utf8Bytes).map((b) => String.fromCharCode(b)).join('');
    const body = btoa(bodyStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const fakeJwt = `${header}.${body}.fake_signature`;

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({
        access_token: fakeJwt,
        refresh_token: 'fake-refresh'
      }), { status: 200 })
    );

    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    const { addOrUpdateCharacter } = await import('../src/utils/authStorage');
    expect(addOrUpdateCharacter).toHaveBeenCalledWith('CHARACTER:EVE:9999', {
      accessToken: fakeJwt,
      refreshToken: 'fake-refresh',
      characterName: 'Jön Dœ 🚀'
    });
  });
});
