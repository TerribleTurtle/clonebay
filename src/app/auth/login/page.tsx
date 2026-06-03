"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setPkceState, setCodeVerifier } from "@/utils/AuthRepository";

import { generateRandomString, generateCodeChallenge } from "@/utils/pkce";

const STATE_LENGTH = 16;
const CODE_VERIFIER_LENGTH = 32;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startLogin() {
      try {
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

        const scopes = [
          "esi-skills.read_skillqueue.v1",
          "esi-skills.read_skills.v1",
          "esi-industry.read_character_jobs.v1",
          "esi-planets.manage_planets.v1",
          "esi-wallet.read_character_wallet.v1",
          "esi-location.read_location.v1",
          "esi-clones.read_clones.v1",
          "esi-characters.read_fatigue.v1",
          "esi-location.read_ship_type.v1",
          "esi-mail.read_mail.v1",
          "esi-contracts.read_character_contracts.v1",
          "esi-markets.read_character_orders.v1"
        ].join(" ");

        const params = new URLSearchParams({
          response_type: "code",
          redirect_uri: redirectUri,
          client_id: clientId,
          scope: scopes,
          state: state,
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        });

        // eslint-disable-next-line no-restricted-properties
        window.location.href = `https://login.eveonline.com/v2/oauth/authorize?${params.toString()}`;
      } catch (err) {
        console.error("Failed to start login:", err);
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
