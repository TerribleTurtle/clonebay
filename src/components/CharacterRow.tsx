import React from 'react';
import { CharacterStatus, useCharacterStore } from '../store/useCharacterStore';
import { get, set } from 'idb-keyval';

interface CharacterRowProps {
  characterName: string;
  status: CharacterStatus;
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

export const CharacterRow: React.FC<CharacterRowProps> = ({ characterName, status }) => {
  const handleRemove = async () => {
    try {
      const tokens = await get<Record<string, unknown>>('eve_auth_tokens') || {};
      delete tokens[characterName];
      await set('eve_auth_tokens', tokens);
      useCharacterStore.getState().removeCharacter(characterName);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to remove character ${characterName}:`, error);
      throw error;
    }
  };

  const displayName = status.name || characterName;
  const iskFormatted = status.isk !== undefined ? `${status.isk.toLocaleString()} ISK` : '--- ISK';
  const spFormatted = status.totalSp !== undefined ? `${status.totalSp.toLocaleString()} SP` : '--- SP';
  const locationText = status.locationName || 'UNKNOWN SYSTEM';

  return (
    <div className="flex flex-col xl:flex-row items-center justify-between border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900 transition-colors">
      <div className="flex flex-col w-full xl:w-auto mb-3 xl:mb-0">
        <div className="text-amber-500 font-bold tracking-wide uppercase text-lg truncate">
          {displayName}
        </div>
        <div className="flex gap-4 text-xs text-zinc-400 font-mono mt-1 uppercase tracking-wider">
          <span>{iskFormatted}</span>
          <span>{spFormatted}</span>
          <span className="text-zinc-500">[{locationText}]</span>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto tabular-nums">
        <div className={`flex-1 sm:flex-none border px-3 py-1 text-xs uppercase tracking-widest text-center min-w-[100px] ${getStatusColor(status.skills)}`}>
          SKILL: {status.skills}
        </div>
        <div className={`flex-1 sm:flex-none border px-3 py-1 text-xs uppercase tracking-widest text-center min-w-[100px] ${getStatusColor(status.industry)}`}>
          IND: {status.industry}
        </div>
        <div className={`flex-1 sm:flex-none border px-3 py-1 text-xs uppercase tracking-widest text-center min-w-[100px] ${getStatusColor(status.pi)}`}>
          PI: {status.pi}
        </div>
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
};
