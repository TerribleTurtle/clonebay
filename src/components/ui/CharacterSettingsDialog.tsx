"use client";

import { useState } from 'react';
import { useCharacterConfigStore, CharacterVisibility } from '../../store/useCharacterConfigStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export interface CharacterSettingsDialogProps {
  characterId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'General' | 'Thresholds' | 'Visibility';

export function CharacterSettingsDialog({
  characterId,
  isOpen,
  onClose,
}: CharacterSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('General');

  const configStore = useCharacterConfigStore();
  const globalSettings = useSettingsStore();
  
  const charConfig = configStore.configs[Number(characterId)] || {
    visibility: { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true },
    overrides: {}
  };

  const isIskInherit = charConfig.overrides.walletYellow === undefined;
  
  const displayYellow = isIskInherit ? globalSettings.walletYellowThreshold : charConfig.overrides.walletYellow;
  const displayRed = isIskInherit ? globalSettings.walletRedThreshold : charConfig.overrides.walletRed;

  if (!isOpen) return null;

  const handleVisibilityToggle = (key: keyof CharacterVisibility) => {
    configStore.setVisibility(Number(characterId), key, !charConfig.visibility[key]);
  };

  const handleIskInheritChange = (inherit: boolean) => {
    if (inherit) {
      configStore.clearOverride(Number(characterId), 'walletYellow');
      configStore.clearOverride(Number(characterId), 'walletRed');
    } else {
      configStore.setOverride(Number(characterId), 'walletYellow', globalSettings.walletYellowThreshold);
      configStore.setOverride(Number(characterId), 'walletRed', globalSettings.walletRedThreshold);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono">
      <div className="w-full max-w-2xl border border-eve-border border-zinc-700 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
          <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">
            Settings // {characterId}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-red-500 focus:outline-none"
            aria-label="Close dialog"
          >
            [X]
          </button>
        </div>

        {/* Body */}
        <div className="flex h-[500px]">
          {/* Sidebar Tabs */}
          <div className="w-48 space-y-1 border-r border-zinc-800 bg-zinc-900/50 p-2">
            {(['General', 'Thresholds', 'Visibility'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`block w-full border-l-2 px-3 py-2 text-left text-sm uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 text-zinc-300">
            {activeTab === 'General' && (
              <div className="space-y-4">
                <h3 className="mb-4 border-b border-zinc-800 pb-2 text-amber-500 uppercase tracking-widest">
                  General Configuration
                </h3>
                <p className="text-sm text-zinc-500">
                  Configure core identity settings for this character.
                </p>
              </div>
            )}

            {activeTab === 'Thresholds' && (
              <div className="space-y-6">
                <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-amber-500 uppercase tracking-widest">
                    Wallet ISK Thresholds
                  </h3>
                  <button
                    onClick={() => handleIskInheritChange(true)}
                    className="text-xs uppercase text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-amber-500"
                  >
                    Revert all to Global Default
                  </button>
                </div>

                <div className="space-y-4 border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="mb-4 flex items-center gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="isk_inherit"
                        checked={isIskInherit}
                        onChange={() => handleIskInheritChange(true)}
                        className="accent-amber-500"
                      />
                      <span className={isIskInherit ? 'text-amber-500' : 'text-zinc-500'}>
                        Inherit Global
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="isk_inherit"
                        checked={!isIskInherit}
                        onChange={() => handleIskInheritChange(false)}
                        className="accent-amber-500"
                      />
                      <span className={!isIskInherit ? 'text-cyan-400' : 'text-zinc-500'}>
                        Custom Override
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-yellow-500">Yellow Warning</label>
                      <input
                        type="number"
                        disabled={isIskInherit}
                        value={displayYellow}
                        onChange={(e) => configStore.setOverride(Number(characterId), 'walletYellow', Number(e.target.value))}
                        className={`w-48 border bg-zinc-950 px-3 py-1 text-right outline-none transition-colors ${
                          isIskInherit
                            ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                            : 'border-cyan-900/50 text-cyan-50 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-red-500">Red Alert</label>
                      <input
                        type="number"
                        disabled={isIskInherit}
                        value={displayRed}
                        onChange={(e) => configStore.setOverride(Number(characterId), 'walletRed', Number(e.target.value))}
                        className={`w-48 border bg-zinc-950 px-3 py-1 text-right outline-none transition-colors ${
                          isIskInherit
                            ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                            : 'border-cyan-900/50 text-cyan-50 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] focus:ring-1 focus:ring-cyan-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Visibility' && (
              <div className="space-y-4">
                <h3 className="mb-4 border-b border-zinc-800 pb-2 text-amber-500 uppercase tracking-widest">
                  Module Visibility
                </h3>
                <p className="mb-6 text-sm text-zinc-500">
                  Toggle which modules are displayed for this character on the dashboard.
                </p>

                <div className="space-y-3">
                  {[
                    { key: 'trackSkills' as const, label: 'SKILL_TRACKING' },
                    { key: 'trackPi' as const, label: 'PI_TRACKING' },
                    { key: 'trackIndy' as const, label: 'INDY_TRACKING' },
                    { key: 'trackMail' as const, label: 'MAIL_TRACKING' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-3 border border-transparent p-2 transition-colors hover:border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={charConfig.visibility[key]}
                          onChange={() => handleVisibilityToggle(key)}
                          className="peer sr-only"
                        />
                        <div className="flex h-5 w-5 items-center justify-center border border-zinc-600 bg-zinc-950 transition-colors peer-checked:border-amber-500 peer-checked:bg-amber-500/20">
                          {charConfig.visibility[key] && (
                            <div className="h-2.5 w-2.5 bg-amber-500" />
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm tracking-widest ${
                          charConfig.visibility[key] ? 'text-zinc-200' : 'text-zinc-600'
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 bg-zinc-900 p-4">
          <button
            onClick={onClose}
            className="bg-zinc-800 px-6 py-2 text-sm uppercase tracking-widest text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
