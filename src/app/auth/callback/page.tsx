"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addOrUpdateCharacter } from "@/utils/authStorage";

const EXPECTED_JWT_PARTS = 3;
const HEX_RADIX = 16;
const SLICE_LAST_TWO = -2;

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

      const response = await fetch("https://login.eveonline.com/v2/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Host": "login.eveonline.com"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch token: ${errorText}`);
      }

      const tokenData = await response.json();
      
      // Decode JWT to extract character identity
      const tokenParts = tokenData.access_token.split(".");
      if (tokenParts.length !== EXPECTED_JWT_PARTS) {
        throw new Error("Invalid JWT format received from EVE SSO.");
      }

      const payloadBase64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payloadJson = decodeURIComponent(
        atob(payloadBase64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(HEX_RADIX)).slice(SLICE_LAST_TWO))
          .join("")
      );
      const payload = JSON.parse(payloadJson);

      const characterId = payload.sub;
      const characterName = payload.name;

      if (!characterId || !characterName) {
        throw new Error("Missing 'sub' or 'name' claims in token payload.");
      }

      // Store in IndexedDB dictionary
      await addOrUpdateCharacter(characterId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        characterName: characterName,
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
