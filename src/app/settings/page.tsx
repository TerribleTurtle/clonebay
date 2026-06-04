'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useDataWipe } from '../../hooks/useDataWipe';
import { Button } from '../../components/ui/Button';
import { configSchema } from '../../lib/schemas/configSchema';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { handleWipeData } = useDataWipe();
  const [mounted, setMounted] = useState(false);

  const [draftSettings, setDraftSettings] = useState({
    walletYellowThreshold: 0,
    walletRedThreshold: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setDraftSettings({
      walletYellowThreshold: settings.walletYellowThreshold,
      walletRedThreshold: settings.walletRedThreshold,
    });
    setErrors({});
  }, [settings.walletYellowThreshold, settings.walletRedThreshold]);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const handleSave = () => {
    const result = configSchema.safeParse(draftSettings);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        walletYellowThreshold: fieldErrors['walletYellowThreshold']?.[0] || "",
        walletRedThreshold: fieldErrors['walletRedThreshold']?.[0] || "",
      });
      return;
    }
    
    setErrors({});
    settings.setWalletYellowThreshold(draftSettings.walletYellowThreshold);
    settings.setWalletRedThreshold(draftSettings.walletRedThreshold);
  };

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
                value={draftSettings.walletYellowThreshold}
                onChange={(e) => setDraftSettings(prev => ({ ...prev, walletYellowThreshold: Number(e.target.value) }))}
                className={`bg-zinc-900 border px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                  errors['walletYellowThreshold'] ? 'border-status-red' : 'border-zinc-700'
                }`}
              />
              {errors['walletYellowThreshold'] && (
                <p className="text-status-red text-sm mt-1">{errors['walletYellowThreshold']}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="red-thresh" className="text-sm tracking-wider">Wallet ISK Critical (Red)</label>
              <input 
                id="red-thresh"
                type="number" 
                value={draftSettings.walletRedThreshold}
                onChange={(e) => setDraftSettings(prev => ({ ...prev, walletRedThreshold: Number(e.target.value) }))}
                className={`bg-zinc-900 border px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                  errors['walletRedThreshold'] ? 'border-status-red' : 'border-zinc-700'
                }`}
              />
              {errors['walletRedThreshold'] && (
                <p className="text-status-red text-sm mt-1">{errors['walletRedThreshold']}</p>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button 
                onClick={handleSave}
                variant="default"
                className="mt-4 text-sm font-bold"
              >
                Save Settings
              </Button>
              <Button 
                onClick={() => settings.resetToDefaults()}
                variant="ghost"
                className="mt-4 text-xs"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold tracking-widest uppercase text-status-red border-b border-zinc-800 pb-2">Data Management</h2>
          <p className="text-sm text-zinc-400">Because EVE-Dash has no backend, all your SSO tokens and cache live exclusively in this browser. You can obliterate them here.</p>
          
          <div className="bg-eve-panel border border-status-red/50 p-4">
            <Button 
              onClick={() => handleWipeData("WARNING: This will wipe all SSO tokens and ESI cache. You will need to log back in. Continue?")}
              variant="destructive"
              className="w-full py-3"
            >
              Initiate Total Local Data Wipe
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
