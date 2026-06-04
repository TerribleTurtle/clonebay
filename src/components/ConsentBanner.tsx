'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export const ConsentBanner: React.FC = () => {
  const consentStatus = useSettingsStore((s) => s.consentStatus);
  const setConsentStatus = useSettingsStore((s) => s.setConsentStatus);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleConsent = (consented: boolean) => {
    setConsentStatus(consented ? 'granted' : 'denied');
  };

  if (!mounted || consentStatus !== 'unknown') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-zinc-950/95 border-t border-amber-900/50 backdrop-blur-md shadow-[0_-10px_40px_-10px_rgba(245,158,11,0.15)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-sm font-mono text-zinc-400">
          <p className="mb-1 text-amber-500 font-bold uppercase tracking-wider">Storage Protocol Authorization</p>
          This terminal requires local storage access (IndexedDB & LocalStorage) to securely store your EVE SSO tokens and character states entirely within your browser. No data is sent to external servers.{' '}
          <a href="/privacy" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">View Privacy Policy</a>
        </div>
        <div className="flex items-center gap-3 tabular-nums">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="px-6 py-2 bg-emerald-950/30 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/50 transition-colors uppercase tracking-widest text-xs font-bold whitespace-nowrap"
          >
            Authorize
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="px-6 py-2 bg-zinc-900/50 border border-zinc-700 text-zinc-500 hover:bg-zinc-800 transition-colors uppercase tracking-widest text-xs font-bold whitespace-nowrap"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
