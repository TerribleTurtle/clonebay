<!-- markdownlint-disable MD013 -->
# Privacy Policy

Clone Bay is an open-source, client-side web application built for EVE Online multiboxers. This document outlines how Clone Bay handles your data, what is stored on your device, and how you can delete or revoke access at any time.

## 1. Zero-Backend Architecture

Clone Bay operates on a strict zero-backend architecture:

- **No Application Servers**: Clone Bay does not operate or communicate with any project-run application backend or user database.
- **Direct-to-CCP Communication**: All character game data and authentication tokens are exchanged directly between your browser and official CCP Games servers.
- **Client-Side Processing**: Status calculations (such as traffic light indicators, skill training thresholds, and industry job timers) occur entirely within your local browser JavaScript runtime.
- **Static Hosting Only**: The web app only downloads static assets (HTML, JavaScript, CSS, and fonts) from Cloudflare Pages. No user data, character data, or tokens are ever sent to project servers.

## 2. What Data Is Stored and Where

All persistent application data is stored locally within your browser using standard web storage APIs:

### IndexedDB

- **`eve_auth_tokens`**: Stores OAuth 2.0 access tokens, refresh tokens, and character names keyed by character ID.
  > [!NOTE]
  > Tokens are stored locally as plain JSON records in IndexedDB without application-level encryption. They are isolated to the Clone Bay origin by your browser's Same-Origin Policy.
- **ESI Response Cache**: Cached responses from CCP's ESI endpoints, keyed by the full request URL (`https://esi.evetech.net/...`), respecting HTTP cache headers to minimize network usage.
- **`eve_name_cache`**: Caches resolved entity names (character names, corporation names, solar systems) to avoid redundant lookups.
- **SDE Cache (`sde_type_*`, `sde_system_*`)**: Caches static data export type and solar system definitions.
- **`eve_notifications_<characterId>`**: Caches retrieved character notifications for alert calculations.
- **`eve_wallet_journal_<characterId>`**: Caches recent wallet transactions and journal entries.

### LocalStorage

- **`clonebay-storage`**: Persists client UI state.
- **`clonebay-settings`**: Persists user preferences (wallet alert thresholds and the mock-mode flag).
- **`eve-character-config-storage`**: Persists per-character visibility settings and alert threshold overrides.
- **`eve-log-store`**: Stores local client diagnostic logs for in-browser debugging.
- **`eve_mock_mode`**: Flag toggling local mock fixtures during offline development.

### SessionStorage

- **`oauth_state`**: A cryptographically random string generated for Cross-Site Request Forgery (CSRF) protection during EVE SSO login.
- **`code_verifier`**: The PKCE code verifier generated on your client for token exchange.
- Both values are short-lived: they are cleared when the login callback finishes (success or failure), and sessionStorage is discarded when the browser tab is closed.

## 3. Network Requests & Third-Party Services

Clone Bay limits network connections via strict Content Security Policy (CSP) headers. Network requests originating from your browser only connect to:

| Domain | Purpose | Data Transmitted |
| --- | --- | --- |
| `login.eveonline.com` | Official EVE SSO authentication & token refresh | PKCE code exchange, refresh tokens |
| `esi.evetech.net` | Official EVE Swagger Interface (ESI) | Bearer access tokens, game data queries |
| `images.evetech.net` | Official EVE character portraits & item icons | Public asset IDs |
| Cloudflare Pages | Hosting static web assets | Standard static asset requests (HTML/JS/CSS) |

> [!NOTE]
> The repository includes a Cloudflare Pages Function at `functions/api/resolve.ts` for potential edge name resolution, but the web application in `src/` does not call this endpoint. The web app makes zero requests to project-run APIs.

## 4. Third-Party Hosting and Authentication Providers

- **Hosting Provider**: Static assets are hosted on Cloudflare Pages. Please review the [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/) for details on edge network access logs.
- **Authentication Provider**: Authentication is handled through CCP Games' official EVE SSO service. Please review the [CCP Games Privacy Policy](https://www.ccpgames.com/privacy-policy).

## 5. Cookies and Tracking

- **Zero Tracking**: Clone Bay does not use Google Analytics, Sentry, Mixpanel, or any other telemetry or tracking scripts.
- **Zero Advertising**: There are no advertisements or third-party marketing embeds.
- **No Cookies**: Clone Bay does not set HTTP tracking or session cookies. Local storage technologies (IndexedDB, localStorage, sessionStorage) are used exclusively for core application functionality.

## 6. How to Wipe Data and Revoke Access

You have full control over your stored credentials and character data:

1. **Local Terminal Wipe**:
   - Navigate to `/trust` or `/settings` in Clone Bay.
   - Click **Execute Terminal Wipe** / **Wipe Data**.
   - This immediately clears the `eve_auth_tokens` dictionary in IndexedDB, flushes all `localStorage` keys, clears `sessionStorage`, and resets the application state.
2. **Revoke EVE SSO Authorizations**:
   - To invalidate refresh tokens so they can never be used again, visit CCP's official authorized applications portal:
   - [Manage Authorized Applications on developers.eveonline.com](https://developers.eveonline.com/authorized-apps)
   - Locate **Clone Bay** (or your personal developer application) and click **Revoke**.
