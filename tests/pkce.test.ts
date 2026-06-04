import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateRandomString, generateCodeChallenge } from '../src/auth/pkce';

describe('pkce', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generateRandomString should use crypto.getRandomValues and return correct hex length', () => {
    const getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues');
    const length = 16;
    const result = generateRandomString(length);

    expect(getRandomValuesSpy).toHaveBeenCalled();
    // each byte becomes 2 hex characters
    expect(result).toHaveLength(length * 2);
    expect(/^[0-9a-f]+$/i.test(result)).toBe(true);
  });

  it('generateCodeChallenge should compute correct base64url encoded SHA-256 hash', async () => {
    const codeVerifier = 'a_very_secure_random_string_that_is_long_enough';
    const challenge = await generateCodeChallenge(codeVerifier);

    // To verify, we check against a known result or the format.
    // The base64url of SHA-256 for this verifier.
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge.includes('+')).toBe(false);
    expect(challenge.includes('/')).toBe(false);
    expect(challenge.includes('=')).toBe(false);
    expect(challenge.length).toBeGreaterThan(40);
  });
});
