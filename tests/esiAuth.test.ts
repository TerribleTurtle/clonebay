import { describe, it, expect } from 'vitest';
import { buildEsiAuthUrl, ESI_SCOPES } from '../src/auth/esiAuth';

describe('esiAuth', () => {
  describe('buildEsiAuthUrl', () => {
    it('should generate a valid ESI OAuth URL with exact required scope parameters', () => {
      const redirectUri = 'http://localhost:3000/auth/callback';
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
});


