// @vitest-environment jsdom
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CallbackPage from '../src/app/auth/callback/page';
import { exchangeCodeForToken } from '../src/services/esi/ssoClient';

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams
}));

vi.mock('../src/auth/AuthRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/auth/AuthRepository')>();
  return {
    ...actual,
    addOrUpdateCharacter: vi.fn()
  };
});

vi.mock('../src/services/esi/ssoClient', () => ({
  exchangeCodeForToken: vi.fn()
}));

describe('Auth Callback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    process.env = { ...originalEnv };
    process.env['NEXT_PUBLIC_EVE_CLIENT_ID'] = 'test-client-id';
  });

  afterEach(() => {
    process.env = originalEnv;
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

  it('successfully exchanges code and updates character', async () => {
    mockSearchParams.set('code', 'test-code');
    mockSearchParams.set('state', 'correct-state');
    
    sessionStorage.setItem('oauth_state', 'correct-state');
    sessionStorage.setItem('code_verifier', 'test-verifier');

    vi.mocked(exchangeCodeForToken).mockResolvedValue({
      accessToken: 'fake-access',
      refreshToken: 'fake-refresh',
      expiresIn: 1200,
      characterId: '123456789',
      characterName: 'Test Character'
    });

    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    const { addOrUpdateCharacter } = await import('../src/auth/AuthRepository');
    expect(addOrUpdateCharacter).toHaveBeenCalledWith('123456789', {
      accessToken: 'fake-access',
      refreshToken: 'fake-refresh',
      characterName: 'Test Character'
    });
  });
});
