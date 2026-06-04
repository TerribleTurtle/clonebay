
import { useShallow } from 'zustand/react/shallow';
import { useCharacterStore, StatusLight } from '../store/useCharacterStore';
import { CharacterPortrait } from './ui/CharacterPortrait';
import { CharacterMetrics } from './ui/CharacterMetrics';
import { CharacterStatusBoard, IndicatorStatus } from './ui/CharacterStatusBoard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { CharacterService } from '../services/CharacterService';
import { useState } from 'react';
import { useCharacterConfigStore } from '../store/useCharacterConfigStore';
import { CharacterSettingsDialog } from './ui/CharacterSettingsDialog';
import { logger } from '../utils/logger';

interface CharacterCardProps {
  characterId: string;
}

const mapStatus = (s: StatusLight): IndicatorStatus => {
  switch (s) {
    case 'Green': return 'green';
    case 'Yellow': return 'yellow';
    case 'Red': return 'red';
    case 'Offline':
    default: return 'offline';
  }
};

export function CharacterCard({ characterId }: CharacterCardProps) {
  const status = useCharacterStore(useShallow((state) => state.characters[characterId]));
  const charConfig = useCharacterConfigStore((state) => state.configs[Number(characterId)]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const visibility = charConfig?.visibility || {
    trackSkills: true,
    trackPi: true,
    trackIndy: true,
    trackMail: true,
  };
  
  const handleRemove = async () => {
    try {
      await CharacterService.removeAndReload(characterId);
    } catch (e) {
      logger.error('[CharacterCard] Failed to remove character ' + characterId + ' from IDB:', e);
      throw e;
    }
  };

  if (!status) return null;

  const displayName = status.name || characterId;
  const locationText = status.locationName || (status.location?.solar_system_id ? String(status.location.solar_system_id) : 'UNKNOWN SYSTEM');

  const isk = typeof status.isk === 'number' ? status.isk.toLocaleString() : '---';
  const totalSp = typeof status.totalSp === 'number' ? (status.totalSp + (status.unallocatedSp || 0)).toLocaleString() : '---';

  const clonesCount = status.clones ? status.clones.jump_clones.length : 0;
  const maxClones = status.maxClones || 0;
  const fatigueTimer = status.fatigue?.jump_fatigue_expire_date 
    ? new Date(status.fatigue.jump_fatigue_expire_date).toLocaleString() 
    : '00:00:00';
  const activeShip = status.ship?.ship_name ?? 'Capsule';
  const activeOrders = status.marketOrders ? (Array.isArray(status.marketOrders) ? status.marketOrders.length : status.marketOrders.count) : 0;
  const unreadMail = status.mail?.total_unread_count !== undefined ? status.mail.total_unread_count : 0;

  return (
    <div className="bg-eve-void rounded-none border border-eve-border hover:border-status-cyan hover:shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all flex flex-col h-full min-h-[220px] relative" role="article" aria-label={`Character Card for ${displayName}`}>
      {/* Absolute Header Buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button 
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="text-zinc-600 hover:text-amber-500 active:text-amber-500 font-mono text-xs sm:text-xs text-sm cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center leading-none transition-colors"
          title="Settings"
        >
          [⚙]
        </button>
        <button 
          type="button"
          onClick={handleRemove}
          className="text-zinc-600 hover:text-status-red active:text-status-red font-mono text-xs sm:text-xs text-sm cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center leading-none transition-colors"
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
                {status.stationName ? (
                  <p>{status.stationName}</p>
                ) : status.structureId ? (
                  <p>Structure ID: {status.structureId}</p>
                ) : (
                  <p>In Space</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex flex-col gap-1 text-xs font-mono tabular-nums" role="status" aria-live="polite">
            <span className="text-zinc-400 flex items-center gap-1">
              ISK: <span className="text-status-yellow font-bold tabular-nums" aria-label={`ISK: ${isk}`}>{isk}</span>
            </span>
            <span className="text-zinc-400 flex items-center gap-1">
              Total SP: <span className="text-status-green font-bold tabular-nums" aria-label={`Total SP: ${totalSp}`}>{totalSp}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Scaffold */}
      <div className="flex-1 flex flex-col mt-3 min-w-0">
        <CharacterMetrics 
          clonesCount={clonesCount}
          maxClones={maxClones}
          clonesContext={status.clonesContext}
          fatigueTimer={fatigueTimer}
          fatigueContext={status.fatigue?.jump_fatigue_expire_date ? { jumpFatigueExpireDate: status.fatigue.jump_fatigue_expire_date } : undefined}
          activeShip={activeShip}
          shipContext={status.ship ? { shipName: status.ship.ship_name, typeName: status.ship.ship_type_id.toString() } : undefined}
          activeOrders={activeOrders}
          ordersContext={status.ordersContext ? status.ordersContext.topOrders.map(o => ({ typeName: o })) : undefined}
          unreadMail={unreadMail}
          mailContext={status.mailContext ? status.mailContext.unreadSubjects.map(s => ({ subject: s })) : undefined}
        />
      </div>

      <div className="mt-0">
        <CharacterStatusBoard 
          visibility={visibility}
          statuses={{
            skill: mapStatus(status.skills),
            pi: mapStatus(status.pi),
            indy: mapStatus(status.industry),
            mail: mapStatus(status.mailStatus)
          }}
          alerts={{
            skill: status.skillsContext?.queue,
            pi: status.piContext?.alerts,
            indy: status.indyContext?.alerts,
            mail: status.mailContext?.unreadSubjects
          }}
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
