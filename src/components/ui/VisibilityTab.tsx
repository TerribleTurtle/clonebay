import { useCharacterConfigStore, CharacterVisibility } from '../../store/useCharacterConfigStore';

interface VisibilityTabProps {
  characterId: string;
}

export function VisibilityTab({ characterId }: VisibilityTabProps) {
  const configStore = useCharacterConfigStore();
  
  const charConfig = configStore.configs[Number(characterId)] || {
    visibility: { trackSkills: true, trackPi: true, trackIndy: true, trackMail: true },
    overrides: {}
  };

  const handleVisibilityToggle = (key: keyof CharacterVisibility) => {
    configStore.setVisibility(Number(characterId), key, !charConfig.visibility[key]);
  };

  return (
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
          { key: 'trackWar' as const, label: 'WAR_TRACKING' },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-3 border border-transparent p-2 transition-colors hover:border-zinc-800 hover:bg-zinc-800/50"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={charConfig.visibility[key] ?? false}
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
  );
}
