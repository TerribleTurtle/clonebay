"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addOrUpdateCharacter } from "@/utils/authStorage";

import { exchangeCodeForToken } from "@/utils/ssoClient";

function CallbackLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const savedState = sessionStorage.getItem("oauth_state");
        const codeVerifier = sessionStorage.getItem("code_verifier");

        if (!code || !state || !savedState || !codeVerifier) {
          throw new Error("Missing callback parameters or session data.");
        }

        if (state !== savedState) {
          throw new Error("Invalid state parameter (CSRF mismatch).");
        }

        const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'];
        if (!clientId) {
          throw new Error("Missing NEXT_PUBLIC_EVE_CLIENT_ID");
        }

        const redirectUri = `${window.location.origin}/auth/callback`;

        const { accessToken, refreshToken, expiresIn, characterId, characterName } = await exchangeCodeForToken(
          code,
          codeVerifier,
          clientId,
          redirectUri
        );

        const MS_PER_SECOND = 1000;
        const SAFETY_BUFFER_SEC = 60;
        const safeExpiresIn = Math.max(0, expiresIn - SAFETY_BUFFER_SEC);

        // Store in IndexedDB dictionary
        await addOrUpdateCharacter(characterId, {
          accessToken,
          refreshToken,
          expiresAt: Date.now() + safeExpiresIn * MS_PER_SECOND,
          characterName,
        });

        router.push("/");
      } finally {
        // Clean up session storage regardless of success or failure
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("code_verifier");
      }
    }

    handleCallback().catch((err) => {
      console.error("SSO Callback Critical Error:", err);
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
