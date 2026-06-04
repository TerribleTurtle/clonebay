"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useDataWipe } from "../../hooks/useDataWipe";
import { Button } from "../../components/ui/Button";
import { configSchema } from "../../lib/schemas/configSchema";

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
        walletYellowThreshold: fieldErrors["walletYellowThreshold"]?.[0] || "",
        walletRedThreshold: fieldErrors["walletRedThreshold"]?.[0] || "",
      });
      return;
    }

    setErrors({});
    settings.setWalletYellowThreshold(draftSettings.walletYellowThreshold);
    settings.setWalletRedThreshold(draftSettings.walletRedThreshold);
  };

  return (
    <div className="w-full flex-1 font-mono text-zinc-300 bg-eve-void p-4 md:p-8">
      <div className="flex flex-col mb-8 border-b border-eve-border pb-4">
        <h1 className="text-3xl font-bold tracking-widest uppercase text-eve-cryo drop-shadow-[0_0_8px_rgba(0,255,255,0.3)]">
          System Configuration
        </h1>
        <p className="text-zinc-500 mt-2 text-sm uppercase tracking-wider">
          OpSec Clearance: Administrator
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Threshold Settings */}
        <section className="space-y-4" aria-labelledby="threshold-heading">
          <h2
            id="threshold-heading"
            className="text-xl font-bold tracking-widest uppercase text-status-yellow border-b border-zinc-800 pb-2"
          >
            Global Thresholds
          </h2>
          <p className="text-sm text-zinc-400">
            Configure the absolute values that trigger warning states on the
            dashboard.
          </p>

          <div className="flex flex-col gap-6 bg-eve-tactical border border-eve-border p-4 md:p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-2 relative">
              <label
                htmlFor="yellow-thresh"
                className="text-sm tracking-wider uppercase text-eve-cryo"
              >
                Wallet ISK Warning (Yellow)
              </label>
              <input
                id="yellow-thresh"
                type="number"
                value={draftSettings.walletYellowThreshold}
                onChange={(e) =>
                  setDraftSettings((prev) => ({
                    ...prev,
                    walletYellowThreshold: Number(e.target.value),
                  }))
                }
                aria-invalid={!!errors["walletYellowThreshold"]}
                aria-describedby={
                  errors["walletYellowThreshold"]
                    ? "yellow-thresh-error"
                    : undefined
                }
                className={`bg-eve-void border rounded-none px-4 py-3 text-zinc-100 focus:outline-none focus:border-eve-cryo focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all ${
                  errors["walletYellowThreshold"]
                    ? "border-status-red focus:border-status-red focus:shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              />
              {errors["walletYellowThreshold"] && (
                <p
                  id="yellow-thresh-error"
                  role="alert"
                  className="text-status-red text-sm mt-1 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-status-red animate-pulse" />
                  {errors["walletYellowThreshold"]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 relative">
              <label
                htmlFor="red-thresh"
                className="text-sm tracking-wider uppercase text-eve-cryo"
              >
                Wallet ISK Critical (Red)
              </label>
              <input
                id="red-thresh"
                type="number"
                value={draftSettings.walletRedThreshold}
                onChange={(e) =>
                  setDraftSettings((prev) => ({
                    ...prev,
                    walletRedThreshold: Number(e.target.value),
                  }))
                }
                aria-invalid={!!errors["walletRedThreshold"]}
                aria-describedby={
                  errors["walletRedThreshold"] ? "red-thresh-error" : undefined
                }
                className={`bg-eve-void border rounded-none px-4 py-3 text-zinc-100 focus:outline-none focus:border-eve-cryo focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all ${
                  errors["walletRedThreshold"]
                    ? "border-status-red focus:border-status-red focus:shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              />
              {errors["walletRedThreshold"] && (
                <p
                  id="red-thresh-error"
                  role="alert"
                  className="text-status-red text-sm mt-1 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-status-red animate-pulse" />
                  {errors["walletRedThreshold"]}
                </p>
              )}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-eve-border/50">
              <Button
                onClick={handleSave}
                variant="default"
                className="w-full sm:w-auto text-sm font-bold rounded-none border border-eve-cryo/50 hover:bg-eve-cryo/10 hover:border-eve-cryo focus:ring-0 uppercase tracking-widest"
              >
                Save Settings
              </Button>
              <Button
                onClick={() => settings.resetToDefaults()}
                variant="ghost"
                className="w-full sm:w-auto text-xs rounded-none text-zinc-500 hover:text-zinc-300 uppercase tracking-widest"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section
          className="space-y-4 pt-4"
          aria-labelledby="data-management-heading"
        >
          <h2
            id="data-management-heading"
            className="text-xl font-bold tracking-widest uppercase text-status-red border-b border-zinc-800 pb-2 flex items-center gap-3"
          >
            <span className="w-3 h-3 bg-status-red border border-status-red/50 animate-pulse" />
            Data Management
          </h2>
          <p className="text-sm text-zinc-400">
            Because Clone Bay has no backend, all your SSO tokens and cache live
            exclusively in this browser. You can obliterate them here.
          </p>

          <div className="bg-eve-tactical border border-status-red/50 p-4 md:p-6 shadow-[inset_0_0_20px_rgba(255,0,0,0.1)]">
            <Button
              onClick={() =>
                handleWipeData(
                  "WARNING: This will wipe all SSO tokens and ESI cache. You will need to log back in. Continue?",
                )
              }
              variant="destructive"
              className="w-full py-4 rounded-none border border-status-red hover:bg-status-red/20 focus:ring-0 uppercase tracking-[0.2em] font-bold shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] transition-all"
            >
              Initiate Total Local Data Wipe
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
