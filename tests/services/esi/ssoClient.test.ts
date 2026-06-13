import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exchangeCodeForToken } from '../../../src/services/esi/ssoClient';

describe('ssoClient', () => {
  const mockClientId = 'client_123';
  const mockRedirectUri = 'http://localhost/callback';
  const mockCode = 'code_123';
  const mockCodeVerifier = 'verifier_123';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createMockToken = (payload: Record<string, unknown>) => {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify(payload));
    const signature = btoa('signature');
    return `${header}.${payloadStr}.${signature}`;
  };

  it('should successfully exchange code and decode JWT base64 manually', async () => {
    const mockPayload = {
      sub: 'CHARACTER:EVE:123456',
      name: 'Test Character',
      scp: ['esi-skills.read_skills.v1']
    };

    const mockResponse = {
      access_token: createMockToken(mockPayload),
      expires_in: 1200,
      token_type: 'Bearer',
      refresh_token: 'refresh_123'
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as unknown);

    const result = await exchangeCodeForToken(mockCode, mockCodeVerifier, mockClientId, mockRedirectUri);
    
    expect(result.characterId).toBe('123456');
    expect(result.characterName).toBe('Test Character');
    expect(result.accessToken).toBe(mockResponse.access_token);
  });

  it('should fail loudly on network drop', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network drop'));

    await expect(exchangeCodeForToken(mockCode, mockCodeVerifier, mockClientId, mockRedirectUri))
      .rejects.toThrow('Network error exchanging code for token');
  });

  it('should fail loudly on invalid scp scopes structure (Zod parsing error)', async () => {
    const mockPayload = {
      sub: 'CHARACTER:EVE:123456',
      name: 'Test Character',
      scp: { invalid: 'type' } // Invalid scp scope format
    };

    const mockResponse = {
      access_token: createMockToken(mockPayload),
      expires_in: 1200,
      token_type: 'Bearer',
      refresh_token: 'refresh_123'
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    } as unknown);

    await expect(exchangeCodeForToken(mockCode, mockCodeVerifier, mockClientId, mockRedirectUri))
      .rejects.toThrow();
  });
});


