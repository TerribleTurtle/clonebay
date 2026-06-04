# Trust & Verification Features Plan

The objective is to implement two highly visible features that build user trust and grant explicit control over local data:
1. **"Trust, but Verify" Security Page (`/trust`)**: A dedicated page designed to teach users exactly how our zero-trust architecture works. It will challenge them to open their browser's Network tab (F12) to verify that network requests only go to EVE's official endpoints (`esi.evetech.net` and `login.eveonline.com`). 
2. **The "Wipe" Button**: A prominent kill-switch on the dashboard and navigation that instantly drops all IndexedDB data, clears `sessionStorage`, and resets the application state.

## Proposed Changes

### 1. The Trust Page

#### `src/app/trust/page.tsx`
- Create a new Next.js route for the security page.
- Add an EVE NeoCom styled document layout.
- Include sections explaining:
  - **PKCE OAuth 2.0**: Why there is no `client_secret` and how tokens are acquired safely.
  - **Local Storage Only**: How `idb-keyval` stores the tokens securely in IndexedDB.
  - **Provable Static Hosting**: Mention that the app is an exported static site (`output: 'export'`) with no backend.
  - **The F12 Challenge**: Step-by-step instructions for opening the Network tab in Chrome/Firefox/Edge to audit network traffic and confirm that `clonebay` does not phone home.

### 2. The Wipe Button

#### `src/components/Dashboard.tsx`
- Inject a "Wipe Local Data" button styled in high-alert colors (e.g., hazard orange/red) with sharp NeoCom aesthetic.
- Bind the button to an `onClick` handler that calls a new utility function to clear data.
- *Note: Eventually this may move to a "Settings" modal, but will start on the Dashboard as an E-Stop button.*

#### `src/utils/storage.ts`
- Create a central utility function `wipeAllData()` that:
  - Calls `clear()` from `idb-keyval` to wipe all EVE tokens and cached ESI data.
  - Calls `sessionStorage.clear()`.
  - Calls `localStorage.clear()`.
  - Dispatches an action to the Zustand store to reset the global state.
  - Redirects the user to the `/auth/login` page or the root `/` page.

#### `src/store/useStore.ts`
- Add a `reset()` action to the Zustand store if one does not already exist, allowing the Wipe button to clear React state simultaneously.

## Verification Plan

### Automated Tests
- Create tests in `vitest` to verify that `wipeAllData()` correctly invokes `idb-keyval` clear functions and resets Zustand state.
- Ensure the `/trust` page renders correctly and meets WCAG accessibility guidelines.

### Manual Verification
- Log in with a character, verify tokens exist in IndexedDB.
- Click the "Wipe" button and manually verify in Chrome DevTools (Application Tab) that IndexedDB is completely empty and the UI redirects properly.
- Navigate to the `/trust` page and verify the layout and F12 instructions read clearly.
