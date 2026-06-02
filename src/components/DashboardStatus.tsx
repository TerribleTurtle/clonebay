'use client';

import { useCharacterStore, StatusLight } from '../store/useCharacterStore';

const StatusIndicator = ({ status }: { status: StatusLight }) => {
  let colorClass = 'bg-zinc-700'; // Offline or default
  let glowClass = '';

  if (status === 'Green') {
    colorClass = 'bg-cyan-500';
    glowClass = 'shadow-[0_0_8px_rgba(6,182,212,0.8)]'; // cyan glow for EVE aesthetic
  } else if (status === 'Yellow') {
    colorClass = 'bg-amber-500';
    glowClass = 'shadow-[0_0_8px_rgba(245,158,11,0.8)]';
  } else if (status === 'Red') {
    colorClass = 'bg-red-600';
    glowClass = 'shadow-[0_0_8px_rgba(220,38,38,0.8)]';
  }

  return (
    <div className={`w-3 h-3 rounded-none border border-zinc-900 ${colorClass} ${glowClass}`} aria-label={status} />
  );
};

export const DashboardStatus = ({ characterId }: { characterId: string }) => {
  const characters = useCharacterStore((state) => state.characters);
  const character = characters[characterId];

  if (!character) {
    return (
      <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-none mb-2 tabular-nums">
        <span className="text-zinc-500 text-sm font-mono tracking-wider">OFFLINE - ID: {characterId}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 bg-zinc-950 border border-zinc-800 rounded-none mb-2 font-mono tabular-nums">
      <div className="text-zinc-300 text-sm tracking-widest border-b border-zinc-800 pb-2 mb-3">
        CHAR: {characterId}
      </div>
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-500 tracking-wider">SKILLS</span>
          <StatusIndicator status={character.skills} />
        </div>
        <div className="flex flex-col items-center gap-2 border-l border-r border-zinc-800">
          <span className="text-zinc-500 tracking-wider">INDUSTRY</span>
          <StatusIndicator status={character.industry} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-500 tracking-wider">PI</span>
          <StatusIndicator status={character.pi} />
        </div>
      </div>
    </div>
  );
};
