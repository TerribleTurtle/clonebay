'use client';

import { useDataWipe } from '../../hooks/useDataWipe';

export default function TrustPage() {
  const { handleWipeData } = useDataWipe();


  return (
    <div className="w-full flex-1">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-amber-500">OpSec & Trust Protocol</h1>
      </div>

      <div className="space-y-8 font-mono text-sm text-zinc-300">
        <section>
          <h2 className="text-xl font-bold text-emerald-400 mb-2 uppercase tracking-wide">Zero-Backend Architecture</h2>
          <p className="mb-4">
            EVE-Dash operates on a strict Zero-Trust philosophy. There are no central servers, databases, or tracking scripts storing your data.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong>No Secrets:</strong> We use the EVE SSO PKCE (Proof Key for Code Exchange) flow. This means no <code>client_secret</code> is ever required or stored.</li>
            <li><strong>Browser Only:</strong> Your Access and Refresh tokens are encrypted and stored exclusively in your browser&apos;s IndexedDB.</li>
            <li><strong>Direct Fetch:</strong> All requests to the EVE Swagger Interface (ESI) are made directly from your browser&apos;s Web Workers. Our servers never touch your data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-400 mb-2 uppercase tracking-wide">How to Verify (Trust, but Verify)</h2>
          <p className="mb-4">
            Do not blindly trust web applications with your EVE SSO. You can verify our zero-backend claims yourself:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
            <li><strong>Network Tab:</strong> Open your browser&apos;s Developer Tools (F12) &gt; Network. Watch the traffic. You will only see outgoing requests to <code>login.eveonline.com</code> and <code>esi.evetech.net</code>. No traffic is sent back to our domain.</li>
            <li><strong>Application Tab:</strong> Go to Developer Tools &gt; Application &gt; IndexedDB. You will see <code>eve-dashboard-storage</code> containing your tokens. They live exclusively here.</li>
            <li><strong>Open Source:</strong> Review the source code yourself. The entire pipeline, from token generation to UI rendering, is publicly verifiable.</li>
          </ol>
        </section>

        <section className="mt-12 pt-8 border-t border-red-900/50">
          <h2 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-wide">The Kill-Switch</h2>
          <p className="mb-4 text-zinc-400">
            If you are ever compromised, playing on a public terminal, or just want to revoke access locally, use this button. It will immediately permanently delete all IndexedDB and LocalStorage data associated with EVE-Dash on this browser.
          </p>
          <button
            onClick={() => handleWipeData('Are you sure? This will permanently wipe all stored EVE SSO tokens and character states from your browser.')}
            className="px-6 py-3 bg-red-950/30 border border-red-700 text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors uppercase tracking-widest text-sm font-bold"
          >
            Execute Terminal Wipe
          </button>
        </section>
      </div>
    </div>
  );
}
