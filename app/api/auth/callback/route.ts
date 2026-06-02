import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MS_PER_SECOND = 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const savedState = request.cookies.get("oauth_state")?.value;

  if (state !== savedState) {
    return new Response("Invalid state parameter (CSRF mismatch)", { status: 400 });
  }

  if (!code) {
    return new Response("Authorization code missing", { status: 400 });
  }

  const clientId = process.env.EVE_CLIENT_ID;
  const secretKey = process.env.EVE_SECRET_KEY;
  
  if (!clientId || !secretKey) {
    return new Response("Missing OAuth secrets in .env", { status: 500 });
  }

  const credentials = Buffer.from(`${clientId}:${secretKey}`).toString("base64");

  try {
    // 1. Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://login.eveonline.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "login.eveonline.com"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token Fetch Error:", errorText);
      return new Response("Failed to fetch token", { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Verify the token to get the actual character details (ID and Name)
    const verifyResponse = await fetch("https://login.eveonline.com/oauth/verify", {
      headers: {
        "Authorization": `Bearer ${access_token}`
      }
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("Token Verify Error:", errorText);
      return new Response("Failed to verify token", { status: verifyResponse.status });
    }

    const verifyData = await verifyResponse.json();
    const { CharacterID, CharacterName } = verifyData;

    // 3. Save to database (Assuming a single local user for this dashboard)
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: {} });
    }

    await prisma.eveCharacter.upsert({
      where: { characterId: CharacterID },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * MS_PER_SECOND),
      },
      create: {
        userId: user.id,
        characterId: CharacterID,
        characterName: CharacterName,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * MS_PER_SECOND),
      }
    });

    // 4. Redirect the user back to the dashboard upon success
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("SSO Callback Critical Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
