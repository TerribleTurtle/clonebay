"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { useBoundStore } from '../store/useBoundStore';
import { CharacterCard } from './CharacterCard';
import { useEsiWorkerManager } from '../hooks/useEsiWorkerManager';
import { useSettingsStore } from '../store/useSettingsStore';
import { CharacterService } from '../services/CharacterService';
import { Button } from './ui/Button';

export const Dashboard: React.FC = () => {
  const characterIds = useBoundStore(useShallow((state) => Object.keys(state.characters)));
  const [mounted, setMounted] = useState<boolean>(false);
  const isMockMode = useSettingsStore((state) => state.isMockMode);
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEsiWorkerManager();

  const toggleMockMode = () => {
    const newMockMode = !isMockMode;
    useSettingsStore.getState().setMockMode(newMockMode);
    CharacterService.toggleMockMode(isMockMode);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono tabular-nums" aria-live="polite" role="status">
        <div className="text-status-yellow font-bold uppercase tracking-widest animate-pulse">
          Initializing Neural Link...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-mono text-eve-cryo tabular-nums">
      <div className="flex flex-col md:flex-row justify-end items-center mb-4 border-b border-eve-border pb-2 gap-2">
        {!isMockMode && (
          <Button 
            type="button" 
            variant="success"
            onClick={() => router.push('/auth/login')}
            className="w-full md:w-auto px-4 py-3 md:py-1 text-sm md:text-xs tracking-wider min-h-[44px]"
          >
            Add Clone
          </Button>
        )}
        <Button 
          type="button" 
          variant="default"
          onClick={toggleMockMode}
          className="w-full md:w-auto px-4 py-3 md:py-1 text-sm md:text-xs tracking-wider min-h-[44px]"
        >
          Mock Mode: {isMockMode ? 'ON' : 'OFF'}
        </Button>
      </div>
      
      {characterIds.length === 0 ? (
        <div className="border border-eve-border bg-eve-void p-6 text-center text-zinc-500 rounded-none shadow-[0_0_8px_rgba(34,211,238,0.1)] hover:shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-shadow" role="status" aria-live="polite" aria-label="No clones connected">
          NO CLONES CONNECTED. AWAITING NEURAL LINK.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4" role="status" aria-live="polite" aria-label="Connected clones">
          {characterIds.map((id) => (
            <CharacterCard 
              key={id} 
              characterId={id} 
              onRemove={(removedId) => CharacterService.removeAndReload(removedId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
