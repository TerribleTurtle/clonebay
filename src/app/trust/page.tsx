'use client';

import { useDataWipe } from '../../hooks/useDataWipe';

export default function TrustPage() {
  const { handleWipeData } = useDataWipe();

  return (
    <div className="w-full flex-1">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-amber-500">Trust & Legal Protocol</h1>
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
            <li>
              <strong>Network Tab:</strong> Open your browser&apos;s Developer Tools (F12) &gt; Network. Watch the traffic. You will only see outgoing requests to the following official CCP servers. No traffic is sent back to our domain:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-500">
                <li><code>login.eveonline.com</code>: Used strictly for the initial EVE SSO (Single Sign-On) authentication and secure token refresh.</li>
                <li><code>esi.evetech.net</code>: The EVE Swagger Interface, used to fetch your live character data (skill queues, industry jobs, wallet, etc.).</li>
                <li><code>images.evetech.net</code>: The official EVE image server, used exclusively to fetch character portraits.</li>
              </ul>
            </li>
            <li><strong>Application Tab:</strong> Go to Developer Tools &gt; Application &gt; IndexedDB. You will see <code>eve-dashboard-storage</code> containing your tokens. They live exclusively here.</li>
            <li><strong>Open Source:</strong> Review the source code yourself. The entire pipeline, from token generation to UI rendering, is publicly verifiable.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-400 mb-2 uppercase tracking-wide">Privacy & Storage Policy</h2>
          <p className="mb-4">
            We only process the data required to render the dashboard (Skill Queues, PI, Industry, Wallet). This information is fetched directly from <code>esi.evetech.net</code> and cached strictly in your browser.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong>Zero Tracking:</strong> We do not use Google Analytics, Sentry, or any other telemetry software.</li>
            <li><strong>No "Cookie Consent" Banner:</strong> Under the GDPR and ePrivacy Directive, explicit cookie banners are only required when storing non-essential data. Because EVE-Dash uses your browser&apos;s local storage <strong>exclusively</strong> as a strictly necessary database to hold your EVE SSO tokens—without which the dashboard literally cannot function—we are legally exempt from requiring an annoying pop-up banner. We do not track you, so there is nothing to opt out of.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-emerald-400 mb-2 uppercase tracking-wide">Legal & Copyright</h2>
          <p className="mb-4 text-zinc-400 border-l-4 border-zinc-700 pl-4 py-1 italic">
            EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf. CCP hf. has granted permission to EVE-Dash to use EVE Online and all associated logos and designs for promotional and information purposes on its website but does not endorse, and is not in any way affiliated with, EVE-Dash. CCP is in no way responsible for the content on or functioning of this website, nor can it be liable for any damage arising from the use of this website.
          </p>
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
