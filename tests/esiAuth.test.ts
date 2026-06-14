import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildEsiAuthUrl, ESI_SCOPES } from '../src/auth/esiAuth';
import { refreshAccessToken } from '../src/auth/AuthService';
import { addOrUpdateCharacter, clearAuthDictionary, getAuthDictionary } from '../src/auth/AuthRepository';

describe('esiAuth', () => {
  describe('buildEsiAuthUrl', () => {
    it('should generate a valid ESI OAuth URL with exact required scope parameters', () => {
      const redirectUri = 'https://clonebay.app/auth/callback';
      const clientId = 'test-client-id';
      const state = 'test-state';
      const codeChallenge = 'test-challenge';

      const url = buildEsiAuthUrl(redirectUri, clientId, state, codeChallenge);
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin).toBe('https://login.eveonline.com');
      expect(parsedUrl.pathname).toBe('/v2/oauth/authorize');

      const params = parsedUrl.searchParams;
      expect(params.get('response_type')).toBe('code');
      expect(params.get('redirect_uri')).toBe(redirectUri);
      expect(params.get('client_id')).toBe(clientId);
      expect(params.get('state')).toBe(state);
      expect(params.get('code_challenge')).toBe(codeChallenge);
      expect(params.get('code_challenge_method')).toBe('S256');

      // The URL scope parameters must be exactly the joined ESI_SCOPES
      const expectedScopes = ESI_SCOPES.join(' ');
      expect(params.get('scope')).toBe(expectedScopes);

      // Verify some critical scopes are actually present in the ESI_SCOPES
      expect(expectedScopes).toContain('esi-skills.read_skillqueue.v1');
      expect(expectedScopes).toContain('esi-wallet.read_character_wallet.v1');
      expect(expectedScopes).toContain('esi-industry.read_character_jobs.v1');
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      vi.resetModules();
      vi.stubEnv('NEXT_PUBLIC_EVE_CLIENT_ID', 'test-client-id');
      global.fetch = vi.fn();
      await clearAuthDictionary();
    });

    afterEach(async () => {
      vi.unstubAllEnvs();
      await clearAuthDictionary();
    });

    it('throws error when no auth data is found for character', async () => {
      await expect(refreshAccessToken('char-1')).rejects.toThrow('No auth data found for character char-1');
    });



    it('throws error on network failure', async () => {
      await addOrUpdateCharacter('char-1', { accessToken: 'old-access', refreshToken: 'old-refresh', characterName: 'Char 1' });
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(refreshAccessToken('char-1')).rejects.toThrow('Network error refreshing access token for character char-1: Error: Network error');
    });

    it('throws error on non-ok status response', async () => {
      await addOrUpdateCharacter('char-1', { accessToken: 'old-access', refreshToken: 'old-refresh', characterName: 'Char 1' });
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400
      } as Response);

      await expect(refreshAccessToken('char-1')).rejects.toThrow('ESI OAuth Refresh failed with status 400');
    });

    it('returns new access token and updates auth on success', async () => {
      await addOrUpdateCharacter('char-1', { accessToken: 'old-access', refreshToken: 'old-refresh', characterName: 'Char 1' });
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token'
        })
      } as Response);

      const token = await refreshAccessToken('char-1');
      
      expect(token).toBe('new-access-token');
      
      const dict = await getAuthDictionary();
      expect(dict['char-1']).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        characterName: 'Char 1'
      });
    });
  });
});



