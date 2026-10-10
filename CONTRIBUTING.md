<!-- markdownlint-disable MD013 -->
# Contributing to Clone Bay

Thank you for your interest in contributing to Clone Bay! Clone Bay is an open-source, client-side web application built for EVE Online multiboxers to monitor fleet states in real time without alt-tabbing.

We welcome bug fixes, documentation improvements, and feature contributions. Please review this guide and our project architectural rules before opening a pull request.

## Development Setup

### 1. Prerequisites

- **Node.js**: v20 or higher recommended (compatible with v18+).
- **npm**: v9 or higher.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/TerribleTurtle/clonebay.git
cd clonebay
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

To authenticate against the live ESI API during local development, register a free application at [developers.eveonline.com](https://developers.eveonline.com/applications):

- **Application Type**: Web or Native (PKCE)
- **Callback URL**: `http://localhost:3006/auth/callback`
- **Scopes**: Select the required scopes listed in `src/auth/esiAuth.ts` (or see the [README.md](README.md#getting-started))

Set your Client ID in `.env`:

```env
NEXT_PUBLIC_EVE_CLIENT_ID=your_client_id_here
```

### 4. Running the Dev Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3006](http://localhost:3006) in your browser.

## Quality Gates & Verification

Before submitting code, all quality gates must pass. We provide a consolidated preflight script:

```bash
npm run verify
```

`npm run verify` executes each of the following checks in sequence:

1. **Typecheck**: `npm run type-check` (`tsc --noEmit`)
2. **Mock Schema Verification**: `npm run verify-mocks` (`tsx scripts/verify-mocks.ts`)
3. **Linter**: `npm run lint` (`eslint`)
4. **Unit & Core Tests**: `npm run test:core` (`vitest run`)
5. **Dependency Boundary Check**: `npm run deps:check` (`depcruise src`)

Every check must exit with code `0`.

## Architecture & Code Conventions

For the comprehensive ruleset, refer directly to [AGENTS.md](AGENTS.md). The core standards include:

- **Static Export SPA**: The app is built with Next.js App Router using `output: 'export'`. Client components make direct CORS `fetch` calls to ESI. Server-side features (`app/api/`, `"use server"`, `middleware.ts`, Next.js image optimizer) are strictly banned.
- **Zero Secrets & PKCE Only**: EVE SSO access and refresh tokens live exclusively in client-side IndexedDB (`eve_auth_tokens`). `EVE_CLIENT_SECRET` is banned.
- **Strict TypeScript**: `any` and unsafe `as` type assertions (except `as const`) are prohibited.
- **Fail Loudly**: Never swallow exceptions in empty `catch` blocks. If an endpoint or parser fails, log it with `logger.error` or re-throw so the UI displays the error state rather than silently stale data.
- **Zod as Single Source of Truth**: All ESI schemas must enforce `z.object({...}).strict()`. TypeScript types must be derived via `z.infer<typeof Schema>`.
- **Pure Zustand Stores**: Zustand stores are pure state containers. Mixing I/O operations (IndexedDB, localStorage) or DOM/browser mutations (`window.location`) inside store actions is forbidden. Encapsulate side effects in dedicated repositories or services.
- **EVE NeoCom Design Aesthetic**: Use sharp corners, deep blacks (`bg-zinc-950`), glowing amber/cyan status accents, and technical typography. Generic soft Tailwind tokens are blocked by ESLint.

## Testing & The Real-Fixture Rule

We practice test-driven development for all core domain logic (such as threshold math and skill queue calculations).

- **Real Mock Data Only**: Never create artificial or synthetic mock objects from imagination. All mock data must be copied from live ESI API responses, official CCP documentation, or the SDE.
- **Anti-Hallucination Mock Cloning**: When writing tests, never construct partial ESI objects inline. Always import a hydrated base fixture from `tests/fixtures/` (e.g., `mockSkillQueue[0]`) and clone/merge specific property overrides.
- **Fixture Validation**: Any new or updated JSON fixture in `tests/fixtures/` must validate against its corresponding Zod schema via `npm run verify-mocks`.
- **Exact Boundary Testing**: All time-based status calculations must include explicit boundary tests for the exact zero boundary (`finish_date === nowMs`) to prevent off-by-one errors.

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names (`feat/industry-timer`, `fix/skill-sp-calc`, `docs/readme-update`).
2. **Commit Messages**: Follow standard conventional commits format (`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`).
3. **Run Preflight**: Ensure `npm run verify` exits `0` locally before pushing.
4. **Fill Out Template**: Complete the pull request description using our PR template.
