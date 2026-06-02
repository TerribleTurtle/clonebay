import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.EVE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  
  if (!clientId || !process.env.NEXT_PUBLIC_APP_URL) {
    return new Response("Missing OAuth configuration in .env", { status: 500 });
  }

  // Generate a random state string for CSRF protection
  const STATE_BYTES = 16;
  const state = crypto.randomBytes(STATE_BYTES).toString("hex");

  // The strict MVP scopes required for our dashboard
  const scopes = [
    "esi-skills.read_skillqueue.v1",
    "esi-industry.read_character_jobs.v1",
    "esi-planets.manage_planets.v1"
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: scopes,
    state: state,
  });

  const ssoUrl = `https://login.eveonline.com/v2/oauth/authorize?${params.toString()}`;

  // Set a cookie with the state to verify it in the callback
  const response = NextResponse.redirect(ssoUrl);
  response.cookies.set("oauth_state", state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
