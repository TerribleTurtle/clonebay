"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import { useCharacterStore } from '../store/useCharacterStore';
import { logger } from '../utils/logger';
import { CharacterCard } from './CharacterCard';
import { useEsiWorkerManager } from './useEsiWorkerManager';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { CharacterService } from '../services/CharacterService';
import { Button } from './ui/Button';

export const Dashboard: React.FC = () => {
  const characterIds = useCharacterStore(useShallow((state) => Object.keys(state.characters)));
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const mockMode = SettingsRepository.getMockMode();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMockMode(mockMode);
      setMounted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[Dashboard] Critical Failure: LocalStorage read failed during mock mode initialization. Details: ${errorMessage}`, error);
      throw error; // Fail loudly
    }
  }, []);

  useEsiWorkerManager();

  const toggleMockMode = () => {
    CharacterService.toggleMockMode(isMockMode);
  };

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono" aria-live="polite">
        <div className="text-status-yellow font-bold uppercase tracking-widest animate-pulse">
          Initializing Neural Link...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-mono text-zinc-300">
      <div className="flex justify-end items-center mb-4 border-b border-eve-border pb-2 gap-2">
        {!isMockMode && (
          <Button 
            type="button" 
            variant="success"
            onClick={() => router.push('/auth/login')}
            className="px-4 py-1 text-xs tracking-wider min-h-0"
          >
            Add Clone
          </Button>
        )}
        <Button 
          type="button" 
          variant="default"
          onClick={toggleMockMode}
          className="px-4 py-1 text-xs tracking-wider min-h-0"
        >
          Mock Mode: {isMockMode ? 'ON' : 'OFF'}
        </Button>
      </div>
      
      {characterIds.length === 0 ? (
        <div className="border border-eve-border bg-eve-panel p-6 text-center text-zinc-500">
          NO CLONES CONNECTED. AWAITING NEURAL LINK.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {characterIds.map((id) => (
            <CharacterCard 
              key={id} 
              characterId={id} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
