import { useCharacterConfigStore } from '../../store/useCharacterConfigStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface ThresholdsTabProps {
  characterId: string;
}

export function ThresholdsTab({ characterId }: ThresholdsTabProps) {
  const configStore = useCharacterConfigStore();
  const globalSettings = useSettingsStore();

  const charConfig = configStore.configs[Number(characterId)] || {
    visibility: { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true },
    overrides: {}
  };

  const isIskInherit = charConfig.overrides.walletYellow === undefined;
  
  const displayYellow = isIskInherit ? globalSettings.walletYellowThreshold : charConfig.overrides.walletYellow;
  const displayRed = isIskInherit ? globalSettings.walletRedThreshold : charConfig.overrides.walletRed;

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

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-sm text-yellow-500">Yellow Warning</label>
            <input
              type="number"
              disabled={isIskInherit}
              value={displayYellow}
              onChange={(e) => configStore.setOverride(Number(characterId), 'walletYellow', Number(e.target.value))}
              className={`w-full sm:w-48 border bg-zinc-950 px-3 py-2 sm:py-1 text-right outline-none transition-colors ${
                isIskInherit
                  ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                  : 'border-cyan-900/50 text-cyan-50 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-sm text-red-500">Red Alert</label>
            <input
              type="number"
              disabled={isIskInherit}
              value={displayRed}
              onChange={(e) => configStore.setOverride(Number(characterId), 'walletRed', Number(e.target.value))}
              className={`w-full sm:w-48 border bg-zinc-950 px-3 py-2 sm:py-1 text-right outline-none transition-colors ${
                isIskInherit
                  ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                  : 'border-cyan-900/50 text-cyan-50 focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
