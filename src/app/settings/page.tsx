'use client';

import { useEffect, useState } from 'react';
import { clear as clearIdb } from 'idb-keyval';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleWipeData = async () => {
    if (window.confirm("WARNING: This will wipe all SSO tokens and ESI cache. You will need to log back in. Continue?")) {
      await clearIdb();
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="w-full flex-1 font-mono text-zinc-300">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-cyan-400">System Configuration</h1>
      </div>

      <div className="max-w-2xl space-y-8">
        
        {/* Threshold Settings */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-widest uppercase text-status-yellow border-b border-zinc-800 pb-2">Global Thresholds</h2>
          <p className="text-sm text-zinc-400">Configure the absolute values that trigger warning states on the dashboard.</p>
          
          <div className="space-y-4 bg-eve-panel border border-eve-border p-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="yellow-thresh" className="text-sm tracking-wider">Wallet ISK Warning (Yellow)</label>
              <input 
                id="yellow-thresh"
                type="number" 
                value={settings.walletYellowThreshold}
                onChange={(e) => settings.setWalletYellowThreshold(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="red-thresh" className="text-sm tracking-wider">Wallet ISK Critical (Red)</label>
              <input 
                id="red-thresh"
                type="number" 
                value={settings.walletRedThreshold}
                onChange={(e) => settings.setWalletRedThreshold(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => settings.resetToDefaults()}
                className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold tracking-widest uppercase text-status-red border-b border-zinc-800 pb-2">Data Management</h2>
          <p className="text-sm text-zinc-400">Because EVE-Dash has no backend, all your SSO tokens and cache live exclusively in this browser. You can obliterate them here.</p>
          
          <div className="bg-eve-panel border border-status-red/50 p-4">
            <button 
              onClick={handleWipeData}
              className="w-full py-3 border border-status-red bg-status-red/20 text-status-red uppercase tracking-widest font-bold hover:bg-status-red hover:text-zinc-950 transition-colors"
            >
              Initiate Total Local Data Wipe
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
