"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addOrUpdateCharacter, getPkceState, getCodeVerifier, clearPkceData } from "@/auth/AuthRepository";

import { exchangeCodeForToken } from "@/services/esi/ssoClient";
import { logger } from "@/utils/logger";

class SsoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsoError';
  }
}

class CsrfError extends SsoError {
  constructor(message: string = "Invalid state parameter (CSRF mismatch).") {
    super(message);
    this.name = 'CsrfError';
  }
}

class ConfigurationError extends SsoError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

class SessionDataError extends SsoError {
  constructor(message: string = "Missing callback parameters or session data.") {
    super(message);
    this.name = 'SessionDataError';
  }
}

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const savedState = getPkceState();
        const codeVerifier = getCodeVerifier();

        if (!code || !state || !savedState || !codeVerifier) {
          throw new SessionDataError();
        }

        if (state !== savedState) {
          throw new CsrfError();
        }

        const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'];
        if (!clientId) {
          throw new ConfigurationError("Missing NEXT_PUBLIC_EVE_CLIENT_ID");
        }

        // eslint-disable-next-line no-restricted-properties
        const redirectUri = `${window.location.origin}/auth/callback`;

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

        router.push("/");
      } finally {
        // Clean up session storage regardless of success or failure
        clearPkceData();
      }
    }

    handleCallback().catch((err) => {
      logger.error("SSO Callback Critical Error", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-status-red">
        <h1 className="mb-4 text-2xl font-bold">Authentication Failed</h1>
        <p className="max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center font-mono">
      <div className="mb-4 h-8 w-8 animate-spin rounded-none border-t-2 border-l-2 border-status-cyan"></div>
      <p className="uppercase tracking-widest text-sm text-status-cyan">Verifying Authorization Protocols...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p>Loading...</p></div>}>
      <CallbackLogic />
    </Suspense>
  );
}
