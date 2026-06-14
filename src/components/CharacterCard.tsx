"use client";

import { useShallow } from 'zustand/react/shallow';
import { useBoundStore } from '../store/useBoundStore';
import { CharacterPortrait } from './ui/CharacterPortrait';
import { CharacterMetrics } from './ui/CharacterMetrics';
import { CharacterStatusBoard } from './ui/CharacterStatusBoard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { SkeletonText } from './ui/SkeletonText';
import { useState } from 'react';
import { useCharacterConfigStore } from '../store/useCharacterConfigStore';
import { CharacterSettingsDialog } from './ui/CharacterSettingsDialog';
import { logger } from '../utils/logger';
import { useCharacterPresenter } from '../hooks/useCharacterPresenter';

interface CharacterCardProps {
  characterId: string;
  onRemove?: (id: string) => void;
}

export function CharacterCard({ characterId, onRemove }: CharacterCardProps) {
  const status = useBoundStore(useShallow((state) => state.characters[characterId]));
  const charConfig = useCharacterConfigStore((state) => state.configs[Number(characterId)]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const visibility = charConfig?.visibility || {
    trackSkills: true,
    trackPi: true,
    trackIndy: true,
    trackMail: true,
    trackWar: true,
  };
  
  const handleRemove = async () => {
    try {
      if (onRemove) {
        onRemove(characterId);
      }
    } catch (e) {
      logger.error('[CharacterCard] Failed to remove character ' + characterId + ' from IDB:', e);
      throw e;
    }
  };

  const presenter = useCharacterPresenter(status, characterId);

  if (!presenter) return null;

  const {
    displayName,
    locationText,
    isk,
    totalSp,
    statuses,
    alerts,
    metrics,
    stationName,
    structureId
  } = presenter;

  return (
    <div className="bg-eve-void rounded-none border border-eve-border hover:border-status-cyan hover:shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all flex flex-col h-full min-h-[220px] relative" role="article" aria-label={`Character Card for ${displayName}`}>
      {/* Absolute Header Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button 
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="text-zinc-600 hover:text-amber-500 active:text-amber-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-cyan font-mono text-xs sm:text-xs text-sm cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center leading-none transition-colors"
          title="Settings"
        >
          [⚙]
        </button>
        <button 
          type="button"
          onClick={handleRemove}
          className="text-zinc-600 hover:text-status-red active:text-status-red focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-status-red font-mono text-xs sm:text-xs text-sm cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center leading-none transition-colors"
          title="Remove Character"
        >
          [X]
        </button>
      </div>

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 pb-2">
        <CharacterPortrait characterId={Number(characterId)} characterName={displayName} />
        
        <div className="flex-1 flex flex-col justify-center min-w-0 pt-1">
          <h2 className="text-xl font-bold text-status-yellow truncate tracking-wide font-sans mb-1 pr-6">
            {displayName}
          </h2>
          
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-eve-cryo font-mono tracking-wider truncate mb-2 cursor-help w-fit hover:text-status-cyan transition-colors" aria-label={`Location: ${locationText}`}>
                  [{locationText}]
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-eve-tactical border-eve-border text-zinc-300 font-mono text-xs rounded-none shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                {stationName ? (
                  <p>{stationName}</p>
                ) : structureId ? (
                  <p>Structure ID: {structureId}</p>
                ) : (
                  <p>In Space</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex flex-col gap-1 text-xs font-mono tabular-nums" role="status" aria-live="polite">
            <span className="text-zinc-400 flex items-center gap-1">
              ISK: <span className="text-status-yellow font-bold tabular-nums" aria-label={`ISK: ${isk}`}>{isk === '---' ? <SkeletonText width="w-16" /> : isk}</span>
            </span>
            <span className="text-zinc-400 flex items-center gap-1">
              Total SP: <span className="text-status-green font-bold tabular-nums" aria-label={`Total SP: ${totalSp}`}>{totalSp === '---' ? <SkeletonText width="w-16" /> : totalSp}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Scaffold */}
      <div className="flex-1 flex flex-col mt-3 min-w-0">
        <CharacterMetrics data={{
          ...metrics,
          fatigueTimer: metrics.fatigueTimer === '00:00:00' ? <SkeletonText width="w-16" /> : metrics.fatigueTimer
        }} />
      </div>

      <div className="mt-0">
        <CharacterStatusBoard 
          visibility={visibility}
          statuses={statuses}
          alerts={alerts}
        />
        <CharacterSettingsDialog 
          characterId={characterId}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
