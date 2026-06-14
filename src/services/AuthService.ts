import { addOrUpdateCharacter } from "@/auth/AuthRepository";
import { getPkceState, getCodeVerifier, clearPkceData } from "@/utils/PkceStorage";
import { exchangeCodeForToken } from "@/services/esi/ssoClient";
import { CsrfError, SessionDataError } from "@/errors/AuthErrors";
import { ENV } from "@/config/env";
import { generateRandomString, generateCodeChallenge } from "@/auth/pkce";
import { buildEsiAuthUrl } from "@/auth/esiAuth";
import { setPkceState, setCodeVerifier } from "@/utils/PkceStorage";
export class AuthService {
  /**
   * Exchanges an authorization code for an access token, verifying PKCE.
   * Throws AuthErrors on failure.
   */
  static async handleCallback(code: string | null, state: string | null): Promise<void> {
    try {
      const savedState = getPkceState();
      const codeVerifier = getCodeVerifier();

      if (!code || !state || !savedState || !codeVerifier) {
        throw new SessionDataError();
      }

      if (state !== savedState) {
        throw new CsrfError();
      }

      const clientId = ENV.NEXT_PUBLIC_EVE_CLIENT_ID;
      const redirectUri = ENV.NEXT_PUBLIC_EVE_CALLBACK_URL || `${window.location.origin}/auth/callback`;

      const { accessToken, refreshToken, characterId, characterName } = await exchangeCodeForToken(
        code,
        codeVerifier,
        clientId,
        redirectUri
      );

      // Store in IndexedDB dictionary
      await addOrUpdateCharacter(characterId, {
        accessToken,
        refreshToken,
        characterName,
      });
    } finally {
      // Clean up session storage regardless of success or failure
      clearPkceData();
    }
  }
  static async startLogin(): Promise<void> {
    const clientId = ENV.NEXT_PUBLIC_EVE_CLIENT_ID;
    const redirectUri = ENV.NEXT_PUBLIC_EVE_CALLBACK_URL || `${window.location.origin}/auth/callback`;

    const STATE_LENGTH = 16;
    const CODE_VERIFIER_LENGTH = 32;
    const state = generateRandomString(STATE_LENGTH);
    const codeVerifier = generateRandomString(CODE_VERIFIER_LENGTH);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    setPkceState(state);
    setCodeVerifier(codeVerifier);

    const authUrl = buildEsiAuthUrl(redirectUri, clientId, state, codeChallenge);
    window.location.href = authUrl;
  }
}
