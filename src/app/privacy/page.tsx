import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Protocol | Clone Bay (Unofficial)',
  description:
    'Privacy protocol and zero-telemetry architecture for Clone Bay: local browser storage, direct CCP requests, and data wipe controls.',
};

export default function PrivacyPage() {
  return (
    <div className="w-full flex-1 font-mono text-zinc-300 bg-eve-void p-4 md:p-8">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-eve-cryo drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">
          Privacy Protocol
        </h1>
        <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider">
          OpSec Clearance: Public // Zero-Telemetry Architecture
        </p>
      </div>

      <div className="space-y-10 text-sm text-zinc-300 max-w-4xl">
        {/* Section 1: Browser-Only Storage */}
        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-green/80" />
          <h2 className="text-xl font-bold text-status-green mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-green animate-pulse" />
            1. Client-Only Storage Architecture
          </h2>
          <p className="mb-4 text-zinc-400">
            Clone Bay has no backend user database, no tracking cookies, and no analytics. All data remains exclusively inside your browser:
          </p>
          <div className="space-y-4">
            <div className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-status-cyan uppercase mb-1">
                IndexedDB (Persistent Client Cache)
              </strong>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                <li><code className="text-zinc-300">eve_auth_tokens</code>: EVE SSO access and refresh tokens</li>
                <li><code className="text-zinc-300">eve_name_cache</code>: Cached entity ID-to-name mappings</li>
                <li><strong className="text-zinc-300">ESI HTTP Cache:</strong> Cached ESI responses, keyed by full request URL (<code className="text-zinc-300">https://esi.evetech.net/...</code>)</li>
                <li><code className="text-zinc-300">eve_notifications_*</code>: Cached character notification feeds</li>
                <li><code className="text-zinc-300">eve_wallet_journal_*</code>: Cached wallet journal transactions</li>
              </ul>
            </div>

            <div className="bg-eve-void border border-eve-border/50 p-4">
              <strong className="block text-status-cyan uppercase mb-1">
                localStorage & sessionStorage
              </strong>
              <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                <li><strong className="text-zinc-300">localStorage:</strong> User settings, warning thresholds, character roster visibility, and diagnostic logs</li>
                <li><strong className="text-zinc-300">sessionStorage:</strong> Temporary PKCE verifier (<code className="text-zinc-300">code_verifier</code>), cleared immediately after login</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Direct-to-CCP Requests */}
        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-cyan/80" />
          <h2 className="text-xl font-bold text-status-cyan mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-cyan animate-pulse" />
            2. Direct Network Requests to CCP
          </h2>
          <p className="mb-4 text-zinc-400">
            All character data, authentication exchanges, and game metrics are requested directly from official CCP servers from your browser:
          </p>
          <ul className="space-y-2 text-xs text-zinc-400 bg-eve-void p-4 border border-eve-border">
            <li><span className="text-zinc-200 font-bold">login.eveonline.com:</span> Official EVE SSO OAuth 2.0 PKCE authentication handshake.</li>
            <li><span className="text-zinc-200 font-bold">esi.evetech.net:</span> Direct EVE Swagger Interface calls for skills, industry, and planetary data.</li>
            <li><span className="text-zinc-200 font-bold">images.evetech.net:</span> Official character portraits and game type icons.</li>
          </ul>
        </section>

        {/* Section 3: Cloudflare Hosting & Zero Server Requests */}
        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-yellow/80" />
          <h2 className="text-xl font-bold text-status-yellow mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-yellow animate-pulse" />
            3. Hosting & Zero Project-Run Server Infrastructure
          </h2>
          <p className="mb-3 text-zinc-400">
            Clone Bay is hosted as a static single-page application on Cloudflare Pages.
          </p>
          <div className="bg-eve-void border border-eve-border/50 p-4 text-xs text-zinc-400 space-y-2">
            <strong className="block text-status-yellow uppercase">
              No Application Server Requests:
            </strong>
            <p>
              The web app makes no requests to project-run servers; only static assets are loaded from the host (Cloudflare Pages).
            </p>
            <p>
              All game data and authentication requests go directly to CCP (<code className="text-zinc-300">esi.evetech.net</code>, <code className="text-zinc-300">login.eveonline.com</code>, and <code className="text-zinc-300">images.evetech.net</code> per the CSP policy).
            </p>
          </div>
        </section>

        {/* Section 4: Deletion & Revocation */}
        <section className="bg-eve-tactical border border-eve-border p-6 md:p-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-status-red/80" />
          <h2 className="text-xl font-bold text-status-red mb-4 uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-2 bg-status-red animate-pulse" />
            4. Complete Data Eradication & Revocation
          </h2>
          <p className="mb-4 text-zinc-400">
            You retain absolute sovereignty over your credentials at all times:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-eve-void border border-eve-border/50 p-4 flex flex-col justify-between">
              <div>
                <strong className="block text-status-red uppercase mb-2">
                  Local Terminal Wipe
                </strong>
                <p className="text-xs text-zinc-400 mb-4">
                  Permanently wipe all tokens, caches, and roster preferences stored on this device.
                </p>
              </div>
              <Link
                href="/settings"
                className="inline-block text-center py-2 px-4 border border-status-red text-status-red hover:bg-status-red/10 uppercase text-xs tracking-wider transition-colors"
              >
                Go to Settings Wipe
              </Link>
            </div>

            <div className="bg-eve-void border border-eve-border/50 p-4 flex flex-col justify-between">
              <div>
                <strong className="block text-status-yellow uppercase mb-2">
                  Revoke CCP SSO Authorization
                </strong>
                <p className="text-xs text-zinc-400 mb-4">
                  Revoke Clone Bay&apos;s OAuth access tokens directly on CCP Games&apos; servers.
                </p>
              </div>
              <a
                href="https://community.eveonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center py-2 px-4 border border-status-yellow text-status-yellow hover:bg-status-yellow/10 uppercase text-xs tracking-wider transition-colors"
              >
                CCP Authorized Applications &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
