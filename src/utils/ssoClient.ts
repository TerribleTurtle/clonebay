import { EveSsoTokenResponseSchema, EveSsoJwtPayloadSchema } from "@/schemas/auth";

const EXPECTED_JWT_PARTS = 3;
const HEX_RADIX = 16;
const SLICE_LAST_TWO = -2;
const BASE64_BLOCK_SIZE = 4;

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  characterId: string;
  characterName: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<TokenExchangeResult> {
  const response = await fetch("https://login.eveonline.com/v2/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
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

  const tokenDataUnparsed = await response.json();
  const tokenData = EveSsoTokenResponseSchema.parse(tokenDataUnparsed);
  
  // Decode JWT to extract character identity
  const tokenParts = tokenData.access_token.split(".");
  if (tokenParts.length !== EXPECTED_JWT_PARTS) {
    throw new Error("Invalid JWT format received from EVE SSO.");
  }

  let payloadBase64 = tokenParts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  while (payloadBase64.length % BASE64_BLOCK_SIZE !== 0) {
    payloadBase64 += "=";
  }

  let payloadUnparsed;
  try {
    const payloadJson = decodeURIComponent(
      atob(payloadBase64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(HEX_RADIX)).slice(SLICE_LAST_TWO))
        .join("")
    );
    payloadUnparsed = JSON.parse(payloadJson);
  } catch (error) {
    throw new Error(`Failed to decode JWT payload: ${error instanceof Error ? error.message : String(error)}`);
  }
  const payload = EveSsoJwtPayloadSchema.parse(payloadUnparsed);

  const characterId = payload.sub.split(":").pop();
  const characterName = payload.name;

  if (!characterId || !characterName) {
    throw new Error("Missing 'sub' or 'name' claims in token payload.");
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    characterId,
    characterName,
  };
}
