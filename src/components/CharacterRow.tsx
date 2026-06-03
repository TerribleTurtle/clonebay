import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore, StatusLight } from '../store/useCharacterStore';

interface CharacterRowProps {
  characterId: string;
}
const getStatusColor = (s: string) => {
  switch (s) {
    case 'Green': return 'text-emerald-400 bg-emerald-950/30 border-emerald-800';
    case 'Yellow': return 'text-amber-400 bg-amber-950/30 border-amber-800';
    case 'Red': return 'text-red-400 bg-red-950/30 border-red-800';
    case 'Offline': return 'text-zinc-500 bg-zinc-900/50 border-zinc-800';
    default: return 'text-zinc-500 bg-zinc-900/50 border-zinc-800';
  }
};

const StatusPill: React.FC<{ label: string; status: StatusLight }> = ({ label, status }) => (
  <div className={`flex-1 sm:flex-none border px-3 py-1 text-xs uppercase tracking-widest text-center min-w-[100px] ${getStatusColor(status)}`}>
    {label}: {status}
  </div>
);

export const CharacterRow: React.FC<CharacterRowProps> = React.memo(({ characterId }) => {
  const status = useCharacterStore(useShallow((state) => state.characters[characterId]));
  const handleRemove = async () => {
    try {
      await useCharacterStore.getState().removeCharacter(characterId);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to remove character ${characterId}:`, error);
      throw error;
    }
  };

  if (!status) return null;

  const displayName = status.name || characterId;
  const locationText = status.locationName || 'UNKNOWN SYSTEM';

  return (
    <div className="flex flex-col xl:flex-row items-center justify-between border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900 transition-colors">
      <div className="flex flex-col w-full xl:w-auto mb-3 xl:mb-0">
        <div className="text-amber-500 font-bold tracking-wide uppercase text-lg truncate flex items-baseline gap-2">
          {displayName}
          <span className="text-xs text-zinc-500 font-mono tracking-wider ml-2">[{locationText}]</span>
        </div>
        <div className="flex gap-4 text-xs font-mono mt-1">
          <span className="text-zinc-400">
            ISK: <span className="text-amber-500 font-bold">{status.isk?.toLocaleString() ?? '???'}</span>
          </span>
          <span className="text-zinc-400">
            Total SP: <span className="text-emerald-500 font-bold">{status.totalSp !== undefined ? (status.totalSp + (status.unallocatedSp || 0)).toLocaleString() : '???'}</span>
          </span>
          {status.unallocatedSp !== undefined && status.unallocatedSp > 0 && (
            <span className="text-zinc-400">
              Unallocated: <span className="text-cyan-500 font-bold">{status.unallocatedSp.toLocaleString()}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto tabular-nums">
        <StatusPill label="SKILL" status={status.skills} />
        <StatusPill label="IND" status={status.industry} />
        <StatusPill label="PI" status={status.pi} />
        <button
          type="button"
          onClick={handleRemove}
          className="flex-1 sm:flex-none border border-red-700 bg-red-950/30 text-red-400 px-3 py-1 hover:bg-red-900/50 transition-colors text-xs uppercase tracking-widest text-center min-w-[80px]"
        >
          Remove
        </button>
      </div>
    </div>
  );
});

CharacterRow.displayName = 'CharacterRow';
