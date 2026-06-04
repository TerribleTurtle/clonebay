"use client";

import { useDataWipe } from "../../hooks/useDataWipe";

export default function TrustPage() {
  const { handleWipeData } = useDataWipe();

  return (
    <div className="w-full flex-1 font-mono text-zinc-300 bg-eve-void p-4 md:p-8">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-eve-cryo drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">
          Trust & Legal Protocol
        </h1>
        <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider">
          OpSec Clearance: Public
        </p>
      </div>

      <div className="space-y-12 text-sm text-zinc-300 max-w-4xl">
        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-green/80" />
          <h2 className="text-xl font-bold text-status-green mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-green animate-pulse" />
            Zero-Backend Architecture
          </h2>
          <p className="mb-6 text-zinc-400">
            Clone Bay operates on a strict Zero-Trust philosophy. There are no
            central servers, databases, or tracking scripts storing your data.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <li className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-eve-cryo mb-2 uppercase tracking-wide">
                No Secrets
              </strong>
              <span className="text-zinc-400 text-xs">
                We use the EVE SSO PKCE flow. No <code>client_secret</code> is
                ever required or stored.
              </span>
            </li>
            <li className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-eve-cryo mb-2 uppercase tracking-wide">
                Browser Only
              </strong>
              <span className="text-zinc-400 text-xs">
                Your Access and Refresh tokens are encrypted and stored
                exclusively in IndexedDB.
              </span>
            </li>
            <li className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-eve-cryo mb-2 uppercase tracking-wide">
                Direct Fetch
              </strong>
              <span className="text-zinc-400 text-xs">
                All ESI requests are made directly from your browser. Our
                servers never touch data.
              </span>
            </li>
          </ul>
        </section>

        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-yellow/80" />
          <h2 className="text-xl font-bold text-status-yellow mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-yellow animate-pulse" />
            How to Verify (Trust, but Verify)
          </h2>
          <p className="mb-6 text-zinc-400">
            Do not blindly trust web applications with your EVE SSO. You can
            verify our zero-backend claims yourself:
          </p>
          <ol className="space-y-6 text-zinc-400">
            <li className="border-l border-eve-border pl-4">
              <strong className="text-eve-cryo uppercase">
                1. Network Tab
              </strong>
              <p className="mt-2 text-xs">
                Open Developer Tools (F12) &gt; Network. The only traffic
                hitting our domain (`clonebay.app`) are static files. All game
                data is fetched directly from official CCP servers:
              </p>
              <div className="bg-eve-void p-4 border border-eve-border mt-3 text-[11px] text-zinc-500 font-mono">
                <span className="text-status-cyan uppercase mb-2 block">
                  Connection Matrix:
                </span>
                <ul className="space-y-2">
                  <li>
                    <span className="text-zinc-300">login.eveonline.com</span>:
                    EVE SSO authentication
                  </li>
                  <li>
                    <span className="text-zinc-300">esi.evetech.net</span>: EVE
                    Swagger Interface (game data)
                  </li>
                  <li>
                    <span className="text-zinc-300">images.evetech.net</span>:
                    Character portraits
                  </li>
                </ul>
              </div>
            </li>
            <li className="border-l border-eve-border pl-4">
              <strong className="text-eve-cryo uppercase">
                2. Content Security Policy (CSP)
              </strong>
              <p className="mt-2 text-xs">
                We mathematically bind your browser to prevent data theft. Our
                strict CSP physically blocks network requests to unapproved
                domains.
              </p>
              <div className="bg-eve-void p-4 border border-eve-border mt-3 text-[11px] text-zinc-500 font-mono overflow-x-auto whitespace-pre-wrap">
                default-src &apos;self&apos;; connect-src &apos;self&apos;
                https://esi.evetech.net https://login.eveonline.com; ...
              </div>
            </li>
            <li className="border-l border-eve-border pl-4">
              <strong className="text-eve-cryo uppercase">
                3. Application Tab & Open Source
              </strong>
              <p className="mt-2 text-xs">
                Check Developer Tools &gt; Application &gt; IndexedDB to see
                tokens. The entire pipeline is open source and publicly
                verifiable.
              </p>
            </li>
          </ol>
        </section>

        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold text-eve-cryo mb-4 uppercase tracking-wider">
            Privacy & Legal
          </h2>
          <div className="space-y-4">
            <div className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-status-cyan mb-2 uppercase">
                Zero Tracking Policy
              </strong>
              <p className="text-xs text-zinc-400">
                No Google Analytics, Sentry, or telemetry. No cookie banners
                required as local storage is used exclusively as a strictly
                necessary database.
              </p>
            </div>
            <div className="bg-eve-void border border-eve-border/50 p-4 border-l-4 border-l-zinc-700">
              <p className="text-[10px] text-zinc-500 italic uppercase">
                EVE Online and the EVE logo are the registered trademarks of CCP
                hf. CCP hf. has granted permission to Clone Bay to use EVE
                Online and all associated logos for promotional and information
                purposes but does not endorse, and is not affiliated with, Clone
                Bay.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 p-6 md:p-8 border border-status-red/50 bg-status-red/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-red" />
          <h2 className="text-xl font-bold text-status-red mb-2 uppercase tracking-wide flex items-center gap-3">
            <span className="w-3 h-3 bg-status-red border border-status-red/50 animate-pulse" />
            The Kill-Switch
          </h2>
          <p className="mb-6 text-zinc-400 text-sm">
            If compromised or on a public terminal, use this to immediately
            permanently delete all IndexedDB and LocalStorage data associated
            with Clone Bay on this browser.
          </p>
          <button
            onClick={() =>
              handleWipeData(
                "Are you sure? This will permanently wipe all stored EVE SSO tokens and character states from your browser.",
              )
            }
            className="w-full md:w-auto px-8 py-4 bg-transparent border border-status-red text-status-red hover:bg-status-red/20 transition-all uppercase tracking-[0.2em] font-bold text-sm shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] focus:outline-none focus:ring-1 focus:ring-status-red"
          >
            Execute Terminal Wipe
          </button>
        </section>
      </div>
    </div>
  );
}
