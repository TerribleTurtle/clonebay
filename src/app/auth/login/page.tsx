"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { generateRandomString, generateCodeChallenge } from "@/utils/pkce";

const STATE_LENGTH = 16;
const CODE_VERIFIER_LENGTH = 32;

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    async function startLogin() {
      const clientId = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'];
      if (!clientId) {
        console.error("Missing NEXT_PUBLIC_EVE_CLIENT_ID");
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const state = generateRandomString(STATE_LENGTH);
      const codeVerifier = generateRandomString(CODE_VERIFIER_LENGTH);
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("code_verifier", codeVerifier);

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
        "esi-contracts.read_character_contracts.v1"
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

      window.location.href = `https://login.eveonline.com/v2/oauth/authorize?${params.toString()}`;
    }
    
    startLogin().catch((err) => {
      console.error("Failed to start login:", err);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
      <div className="flex flex-col items-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
        <p>Redirecting to EVE SSO...</p>
      </div>
    </div>
  );
}
