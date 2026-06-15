"use client";
import { useCharacterConfigStore } from '../../store/useCharacterConfigStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Input } from './Input';

interface ThresholdsTabProps {
  characterId: string;
}

export function ThresholdsTab({ characterId }: ThresholdsTabProps) {
  // Use atomic selectors to prevent unnecessary re-renders
  const charConfig = useCharacterConfigStore(state => state.configs[characterId]) || {
    visibility: { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true },
    overrides: {}
  };
  const setOverride = useCharacterConfigStore(state => state.setOverride);
  const clearOverride = useCharacterConfigStore(state => state.clearOverride);

  const globalWalletYellow = useSettingsStore(state => state.walletYellowThreshold);
  const globalWalletRed = useSettingsStore(state => state.walletRedThreshold);

  const isIskInherit = charConfig.overrides.walletYellow === undefined;
  
  const displayYellow = isIskInherit ? globalWalletYellow : charConfig.overrides.walletYellow;
  const displayRed = isIskInherit ? globalWalletRed : charConfig.overrides.walletRed;

  const handleIskInheritChange = (inherit: boolean) => {
    if (inherit) {
      clearOverride(characterId, 'walletYellow');
      clearOverride(characterId, 'walletRed');
    } else {
      setOverride(characterId, 'walletYellow', globalWalletYellow);
      setOverride(characterId, 'walletRed', globalWalletRed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-status-yellow uppercase tracking-widest">
          Wallet ISK Thresholds
        </h3>
        <button
          onClick={() => handleIskInheritChange(true)}
          className="text-xs uppercase text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-status-yellow min-h-[44px] px-2 -ml-2"
        >
          Revert all to Global Default
        </button>
      </div>

      <div className="space-y-4 border border-eve-border bg-eve-panel p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 border border-transparent p-2 transition-colors hover:border-zinc-800 hover:bg-zinc-800/50">
            <input
              type="radio"
              name="isk_inherit"
              checked={isIskInherit}
              onChange={() => handleIskInheritChange(true)}
              className="accent-status-yellow"
            />
            <span className={isIskInherit ? 'text-status-yellow' : 'text-zinc-500'}>
              Inherit Global
            </span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 border border-transparent p-2 transition-colors hover:border-zinc-800 hover:bg-zinc-800/50">
            <input
              type="radio"
              name="isk_inherit"
              checked={!isIskInherit}
              onChange={() => handleIskInheritChange(false)}
              className="accent-status-cyan"
            />
            <span className={!isIskInherit ? 'text-status-cyan' : 'text-zinc-500'}>
              Custom Override
            </span>
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <label className="flex min-h-[44px] items-center text-sm text-status-yellow">Yellow Warning</label>
            <Input
              type="number"
              min="0"
              disabled={isIskInherit}
              value={displayYellow}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val < 0) return;
                setOverride(characterId, 'walletYellow', val);
              }}
              className="w-full text-right sm:w-48"
            />
          </div>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <label className="flex min-h-[44px] items-center text-sm text-status-red">Red Alert</label>
            <Input
              type="number"
              min="0"
              disabled={isIskInherit}
              value={displayRed}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val < 0) return;
                setOverride(characterId, 'walletRed', val);
              }}
              className="w-full text-right sm:w-48 focus:border-status-red focus:shadow-glow-red focus:ring-status-red text-status-red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
