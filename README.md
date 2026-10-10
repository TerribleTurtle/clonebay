<!-- markdownlint-disable MD013 -->
# Clone Bay

A web dashboard I built with Next.js and Tailwind CSS so I can check on several EVE Online characters without alt-tabbing between clients.

> [!NOTE]
> **Unofficial Fan Project Callout**: Clone Bay is an unofficial, community-created open-source fan project. It is not affiliated with, endorsed by, or sponsored by CCP Games. All EVE Online assets and intellectual property belong to CCP hf. See the [Legal Notice](#legal--ccp-games-notice) below.

---

## The Problem

Managing multiple EVE Online accounts requires constant alt-tabbing or cycling client logins just to check routine timers, expiring skill queues, extractors, and jobs. Existing tools are often legacy desktop utilities or complex, self-hosted corporate web applications requiring dedicated servers and database infrastructure.

## The Solution

Clone Bay shows a read-only overview of all your characters on one page: skill queues, industry jobs, PI extractors and other timers. It reads this from ESI, so you don't need to be logged in to the game.

### Core Features

- **Multi-Character EVE SSO**: Log in each character with OAuth 2.0 PKCE. No client secret is stored or needed.
- **Traffic Light Dashboard**: Green, Yellow, and Red status per character for skill queues, jobs, and alerts.
- **Timers**:
  - **Skill Queues**: Training progress, completion times, and empty queue warnings.
  - **Planetary Interaction (PI)**: Extractor cycle tracking and program expiration alerts.
  - **Industry Jobs**: Manufacturing, research, and invention job states and completion countdowns.
  - **Character Overview**: Jump fatigue, clone locations, current ship and location, wallet balance, notifications, and structure status.
- **No Backend**: Runs as a static Single Page Application (SPA) in your browser.

---

## Privacy Model & Architecture

Clone Bay has no backend:

- **No Project Backend or Database**: Clone Bay has no central servers, no user accounts, and no database.
- **Direct-to-CCP Requests**: All authentication and game data queries are made directly from your browser to CCP Games' official endpoints:
  - `https://login.eveonline.com`: EVE SSO authentication and token refresh.
  - `https://esi.evetech.net`: EVE Swagger Interface (ESI) game data.
  - `https://images.evetech.net`: Character portraits and ship rendering.
- **Client-Side Storage**:
  - **`eve_auth_tokens` (IndexedDB)**: Access and refresh tokens are stored locally on your machine in IndexedDB. Tokens are stored in plain JSON and protected by the browser's Same-Origin Policy (no application-level encryption).
  - **ESI Response Cache (IndexedDB)**: Cached API responses keyed by the full request URL (`https://esi.evetech.net/...`) to respect CCP cache headers.
  - **Name & SDE Cache (IndexedDB)**: Entity names (`eve_name_cache`) and Static Data Export definitions (`sde_type_*`, `sde_system_*`).
  - **Local UI Preferences (localStorage)**: User settings (`clonebay-settings`), dashboard state (`clonebay-storage`), character config (`eve-character-config-storage`), and diagnostics (`eve-log-store`).
  - **Ephemeral PKCE Parameters (sessionStorage)**: `oauth_state` and `code_verifier` are purged immediately upon login completion or failure.
- **Content Security Policy**: Because tokens are readable by any script running on the page, the CSP is the main defence against injected scripts. It is sent as an HTTP header (no `'unsafe-eval'`, no `'unsafe-inline'` for scripts). `npm run build` runs `scripts/csp-hashes.mjs`, which hashes each inline Next.js bootstrap script and writes per-route CSP rules into `out/_headers`.
- **Wipe Button**: A wipe button in the UI (`/trust` and `/settings`) clears stored tokens, localStorage, and session state.
- **Zero Telemetry**: No Google Analytics, Sentry, or tracking scripts are included. No tracking cookies are used.

For full details, review our [Privacy Policy](PRIVACY.md) and [Security Policy](SECURITY.md).

---

## Local Development Setup

### Prerequisites

- **Node.js**: v20 or higher recommended (v18+ compatible)
- **npm**: v9 or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/TerribleTurtle/clonebay.git
cd clonebay
npm install
```

### 2. Register an EVE Developer Application

To use EVE SSO locally, register an application on CCP's developer portal:

1. Visit [developers.eveonline.com](https://developers.eveonline.com/applications) and log in.
2. Click **Create Application**.
3. Set **Name** (e.g. `Clone Bay Local Dev`).
4. Set **Connection Type**: `Authentication & API Access`.
5. Set **Callback URL**: `http://localhost:3006/auth/callback`.
6. Enable **PKCE** (no `client_secret` is generated or needed).
7. Select the following **15 OAuth Scopes**:
   - `esi-skills.read_skillqueue.v1`
   - `esi-skills.read_skills.v1`
   - `esi-industry.read_character_jobs.v1`
   - `esi-planets.manage_planets.v1`
   - `esi-wallet.read_character_wallet.v1`
   - `esi-location.read_location.v1`
   - `esi-clones.read_clones.v1`
   - `esi-characters.read_fatigue.v1`
   - `esi-location.read_ship_type.v1`
   - `esi-mail.read_mail.v1`
   - `esi-contracts.read_character_contracts.v1`
   - `esi-markets.read_character_orders.v1`
   - `esi-characters.read_notifications.v1`
   - `esi-characters.read_corporation_roles.v1`
   - `esi-corporations.read_structures.v1`
8. Save the application and copy your **Client ID**.

### 3. Configure Environment Variables

Copy the example configuration file:

```bash
cp .env.example .env
```

Open `.env` and set your Client ID:

```env
NEXT_PUBLIC_EVE_CLIENT_ID=your_client_id_here
```

*(Optional)* If you use a non-default callback URL, set `NEXT_PUBLIC_EVE_CALLBACK_URL`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3006](http://localhost:3006) in your browser.

---

## Quality & Verification Commands

Clone Bay enforces strict architectural standards, TypeScript type-checking, and mock fixture validation:

| Command | Description |
| --- | --- |
| `npm run verify` | Runs the full preflight suite (type-check, verify-mocks, lint, test:core, deps:check) |
| `npm run type-check` | TypeScript compiler check without emitting output (`tsc --noEmit`) |
| `npm run lint` | ESLint verification with strict architectural boundary rules |
| `npm run test:core` | Runs unit and core logic test suite via Vitest (`vitest run`) |
| `npm run verify-mocks` | Validates all mock test fixtures against strict Zod schemas |
| `npm run deps:check` | Verifies architectural module boundaries via Dependency Cruiser |

Before opening a pull request, ensure `npm run verify` passes with exit code `0`. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## Deployment

Clone Bay is built as a static Single Page Application (`output: 'export'`):

1. **Build Static Export**:

   ```bash
   npm run build
   ```

   Static HTML, CSS, and JS assets are emitted into the `out/` directory.

2. **Deploy to Cloudflare Pages**:
   The production deployment is hosted on Cloudflare Pages. Cloudflare serves static assets globally at the edge without requiring a Node.js server.

   ```bash
   npm run deploy:prod
   ```

   The production deployment is live at [https://clonebay.terribleturtles.dev](https://clonebay.terribleturtles.dev). During the transition period, the legacy `clonebay.app` domain displays a migration notice prompting users to migrate and clean up old browser data before the legacy domain is retired.

---

## License

Clone Bay is licensed under the [MIT License](LICENSE).

```text
Copyright (c) 2026 TerribleTurtles
```

---

## Legal & CCP Games Notice

EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf. CCP hf. has granted permission to Clone Bay to use EVE Online and all associated logos and designs for promotional and information purposes on its website but does not endorse, and is not in any way affiliated with, Clone Bay. CCP is in no way responsible for the content on or functioning of this website, nor can it be liable for any damage arising from the use of this website.
