"use client";

import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useCharacterStore } from '../store/useCharacterStore';
import { logger } from '../utils/logger';
import { CharacterRow } from './CharacterRow';
import { useEsiWorkerManager } from './useEsiWorkerManager';

export const Dashboard: React.FC = () => {
  const characterIds = useCharacterStore(useShallow((state) => Object.keys(state.characters)));
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const mockMode = localStorage.getItem('eve_mock_mode') === 'true';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMockMode(mockMode);
      setMounted(true);
    } catch (error) {
      logger.error("Failed to read eve_mock_mode from localStorage:", error);
      throw error; // Fail loudly
    }
  }, []);

  useEsiWorkerManager();

  const toggleMockMode = () => {
    try {
      const newMockMode = !isMockMode;
      localStorage.setItem('eve_mock_mode', String(newMockMode));
      setIsMockMode(newMockMode);
      useCharacterStore.getState().clearAll();
      window.location.reload(); 
    } catch (error) {
      logger.error("Failed to write eve_mock_mode to localStorage:", error);
      throw error; // Fail loudly
    }
  };

  

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center font-mono">
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
          <button 
            type="button" 
            onClick={() => window.location.href = '/auth/login'}
            className="border border-status-green bg-emerald-950/30 text-status-green px-4 py-1 hover:bg-emerald-900/50 transition-colors uppercase text-xs tracking-wider"
          >
            Add Clone
          </button>
        )}
        <button 
          type="button" 
          onClick={toggleMockMode}
          className="border border-status-cyan bg-cyan-950/30 text-status-cyan px-4 py-1 hover:bg-cyan-900/50 transition-colors uppercase text-xs tracking-wider"
        >
          Mock Mode: {isMockMode ? 'ON' : 'OFF'}
        </button>
      </div>
      
      {characterIds.length === 0 ? (
        <div className="border border-eve-border bg-eve-panel p-6 text-center text-zinc-500">
          NO CLONES CONNECTED. AWAITING NEURAL LINK.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {characterIds.map((id) => (
            <CharacterRow 
              key={id} 
              characterId={id} 
               
            />
          ))}
        </div>
      )}
    </div>
  );
};
