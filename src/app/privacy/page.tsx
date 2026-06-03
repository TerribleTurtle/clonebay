
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 font-mono text-zinc-300">
      <div className="border-b border-amber-900/50 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-amber-500">Privacy & Architecture Policy</h1>
        <p className="mt-2 text-sm text-zinc-500 uppercase tracking-widest">Zero-Trust / Zero-Backend Implementation</p>
      </div>

      <section className="space-y-4 border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-amber-500 border-b border-zinc-800 pb-2">1. 100% Client-Side Operation</h2>
        <p>
          This dashboard operates entirely within your browser. There are <strong>no backend servers</strong>, databases, or cloud functions storing your data.
        </p>
        <p>
          Your EVE Online SSO tokens (Access and Refresh tokens) are stored locally in your browser using the <code>IndexedDB</code> API. This data never leaves your device except to communicate directly with the official EVE Online servers.
        </p>
      </section>

      <section className="space-y-4 border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-amber-500 border-b border-zinc-800 pb-2">2. Data Processed</h2>
        <p>We only process the data required to render the dashboard, which includes:</p>
        <ul className="list-inside list-disc space-y-1 text-zinc-400 marker:text-amber-500">
          <li>Character IDs and Names</li>
          <li>Skill Queues</li>
          <li>Planetary Interaction (PI) Layouts</li>
          <li>Industry Jobs</li>
          <li>Wallet Balances and Transactions</li>
        </ul>
        <p>
          This information is fetched directly from <code>esi.evetech.net</code> and cached in your browser.
        </p>
      </section>

      <section className="space-y-4 border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-amber-500 border-b border-zinc-800 pb-2">3. Zero Third-Party Tracking</h2>
        <p>
          We do not use Google Analytics, Sentry, or any other telemetry/tracking software. This is strictly enforced by our Content Security Policy (CSP), which mechanically blocks any network requests to unauthorized third-party domains.
        </p>
      </section>

      <section className="space-y-4 border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-xl font-bold uppercase tracking-wider text-amber-500 border-b border-zinc-800 pb-2">4. Your Right to Erasure (The &quot;Kill-Switch&quot;)</h2>
        <p>
          You have complete control over your data. You can instantly purge all SSO tokens, cached ESI data, and preferences from your browser by using the &quot;Erase Local Data&quot; option in the Settings menu.
        </p>
        <div className="pt-2">
          <Link href="/settings" className="inline-block border border-amber-900/50 bg-zinc-900/50 px-4 py-2 text-sm uppercase tracking-widest text-amber-500 hover:bg-amber-900/20 hover:text-amber-400 transition-colors">
            Go to Settings
          </Link>
        </div>
      </section>

      <div className="pt-4 text-center">
        <Link href="/" className="text-sm font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300">
          ← Return to Terminal
        </Link>
      </div>
    </div>
  );
}
