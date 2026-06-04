"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setPkceState, setCodeVerifier } from "@/auth/AuthRepository";

import { generateRandomString, generateCodeChallenge } from "@/auth/pkce";
import { buildEsiAuthUrl } from "@/auth/esiAuth";
import { logger } from "@/utils/logger";

import { useSettingsStore } from "@/store/useSettingsStore";

const STATE_LENGTH = 16;
const CODE_VERIFIER_LENGTH = 32;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startLogin() {
      try {
        const consentStatus = useSettingsStore.getState().consentStatus;
        if (consentStatus !== "granted") {
          throw new Error("Storage Protocol Authorization is required to establish a neural link. Please return to the main terminal and authorize storage protocols.");
        }

        const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'];
        if (!clientId) {
          throw new Error("Missing NEXT_PUBLIC_EVE_CLIENT_ID");
        }

        // eslint-disable-next-line no-restricted-properties
        const redirectUri = `${window.location.origin}/auth/callback`;
        const state = generateRandomString(STATE_LENGTH);
        const codeVerifier = generateRandomString(CODE_VERIFIER_LENGTH);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        setPkceState(state);
        setCodeVerifier(codeVerifier);

        

        const authUrl = buildEsiAuthUrl(redirectUri, clientId, state, codeChallenge);

        // eslint-disable-next-line no-restricted-properties
        window.location.href = authUrl;
      } catch (err) {
        logger.error("Failed to start login", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    
    startLogin();
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-status-red">
        <h1 className="mb-4 text-2xl font-bold uppercase tracking-widest border-b border-status-red pb-2">Login Sequence Aborted</h1>
        <p className="max-w-md text-center font-mono text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center font-mono">
        <div className="mb-4 h-8 w-8 animate-spin rounded-none border-t-2 border-l-2 border-status-yellow"></div>
        <p className="uppercase tracking-widest text-sm text-status-yellow">Establishing Neural Link...</p>
      </div>
    </div>
  );
}

