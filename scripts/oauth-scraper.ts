import { promises as fs } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load both .env and .env.local
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// DEV-ONLY TOOL: This script is intended only for local development and testing.
// It acts as a scraper to fetch real ESI data to be used as JSON fixtures for tests.
const EVE_CLIENT_ID: string | undefined = process.env['NEXT_PUBLIC_EVE_CLIENT_ID'];
const EVE_CALLBACK_URL: string | undefined = process.env['NEXT_PUBLIC_EVE_CALLBACK_URL'];

// EVE_CLIENT_SECRET is explicitly BANNED in the Next.js app since it uses PKCE.
// However, its usage here is acceptable because this is a local Node.js scraper
// running purely in a dev environment to fetch test fixtures.
const EVE_CLIENT_SECRET: string | undefined = process.env['EVE_CLIENT_SECRET'];

const SCOPES: string = [
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

const tokenResponseSchema = z.object({
  access_token: z.string()
});

const verifyResponseSchema = z.object({
  CharacterID: z.number()
});

function prompt(query: string): Promise<string> {
  const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve: (val: string) => void) => {
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function fetchEsi(endpoint: string, token: string): Promise<unknown> {
  const url: string = `https://esi.evetech.net/latest${endpoint}`;
  const response: Response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function writeFixture(filename: string, data: unknown): Promise<void> {
  const JSON_INDENT = 2;
  const filePath: string = path.join(process.cwd(), 'tests', 'fixtures', filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, JSON_INDENT), 'utf-8');
  console.log(`Successfully wrote ${filePath}`);
}

async function main(): Promise<void> {
  try {
    if (!EVE_CLIENT_ID || !EVE_CALLBACK_URL || !EVE_CLIENT_SECRET) {
      throw new Error('Missing environment variables. Check .env and .env.local.');
    }

    const state: string = 'test-state';
    const authUrl: string = `https://login.eveonline.com/v2/oauth/authorize?response_type=code&redirect_uri=${encodeURIComponent(EVE_CALLBACK_URL)}&client_id=${EVE_CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&state=${state}`;

    console.log('--- EVE SSO OAUTH SCRAPER ---');
    console.log('1) Open this URL in your browser:');
    console.log(authUrl);
    console.log('2) Log in and authorize.');
    console.log('3) You will be redirected to a broken/local page. Copy the ENTIRE URL.');
    
    const redirectUrl: string = await prompt('Paste the full redirect URL here: ');
    
    const parsedUrl: URL = new URL(redirectUrl);
    const code: string | null = parsedUrl.searchParams.get('code');
    
    if (!code) {
      throw new Error('Failed to extract "code" from the provided URL.');
    }

    console.log('Exchanging code for token...');
    
    const authHeader: string = `Basic ${Buffer.from(`${EVE_CLIENT_ID}:${EVE_CLIENT_SECRET}`).toString('base64')}`;
    const tokenResponse: Response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
        'Host': 'login.eveonline.com'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: EVE_CALLBACK_URL
      }).toString()
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData: unknown = await tokenResponse.json();
    const tokenParsed: { access_token: string } = tokenResponseSchema.parse(tokenData);
    const accessToken: string = tokenParsed.access_token;
    
    console.log('Token acquired. Verifying character...');
    const verifyResponse: Response = await fetch('https://login.eveonline.com/oauth/verify', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verify failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyData: unknown = await verifyResponse.json();
    const verifyParsed: { CharacterID: number } = verifyResponseSchema.parse(verifyData);
    const characterId: number = verifyParsed.CharacterID;
    
    console.log(`Character ID: ${characterId}`);

    console.log('Fetching ESI endpoints...');
    const skillqueue: unknown = await fetchEsi(`/characters/${characterId}/skillqueue/`, accessToken);
    const industryJobs: unknown = await fetchEsi(`/characters/${characterId}/industry/jobs/`, accessToken);
    const planets: unknown = await fetchEsi(`/characters/${characterId}/planets/`, accessToken);

    await writeFixture('mockSkillQueue.json', skillqueue);
    await writeFixture('mockIndustryJobs.json', industryJobs);
    await writeFixture('mockPlanets.json', planets);

    console.log('Done!');
  } catch (error: unknown) {
    console.error('Failed to run oauth-scraper:', error);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});
