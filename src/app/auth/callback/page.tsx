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

      // Store in IndexedDB dictionary
      await addOrUpdateCharacter(characterId, {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * MS_PER_SECOND,
        characterName,
      });

      // Clean up session storage
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("code_verifier");

      router.push("/");
    }

    handleCallback().catch((err) => {
      console.error("SSO Callback Critical Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-red-500">
        <h1 className="mb-4 text-2xl font-bold">Authentication Failed</h1>
        <p className="max-w-md text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
      <p>Verifying authentication...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50"><p>Loading...</p></div>}>
      <CallbackLogic />
    </Suspense>
  );
}
