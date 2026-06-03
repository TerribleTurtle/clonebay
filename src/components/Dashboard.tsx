"use client";

import React, { useState, useEffect } from 'react';

import { useCharacterStore } from '../store/useCharacterStore';
import { useLogStore } from '../store/useLogStore';
import { logger } from '../utils/logger';
import { WorkerManager } from '../utils/WorkerManager';
import { CharacterRow } from './CharacterRow';

export const Dashboard: React.FC = () => {
  const characters = useCharacterStore((state) => state.characters);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const mockMode = localStorage.getItem('eve_mock_mode') === 'true';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMockMode(mockMode);
    } catch (error) {
      logger.error("Failed to read eve_mock_mode from localStorage:", error);
      throw error; // Fail loudly
    }
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    try {
      const manager = WorkerManager.getInstance();
      
      unsubscribe = manager.subscribe((event) => {
        const { type, payload, timestamp } = event.data;
        if (type === 'ESI_DATA_UPDATE') {
          useCharacterStore.getState().updateCharacterStatus(payload.characterId, {
            [payload.dataType]: payload.status
          });
        } else if (type === 'ESI_METRICS_UPDATE') {
          useCharacterStore.getState().updateCharacterStatus(payload.characterId, {
            name: payload.name,
            isk: payload.isk,
            totalSp: payload.totalSp,
            locationId: payload.locationId,
            locationName: payload.locationName,
            stationId: payload.stationId,
            structureId: payload.structureId
          });
        } else if (type === 'POLL_COMPLETE') {
          useCharacterStore.getState().setLastPolled(timestamp);
        } else if (type === 'WORKER_LOG') {
          useLogStore.getState().addLog(payload);
        }
      });
      
      const isMock = localStorage.getItem('eve_mock_mode') === 'true';
      manager.start(isMock);
    } catch (error) {
      logger.error("Failed to start ESI Worker via WorkerManager:", error);
      throw error; // Fail loudly
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      WorkerManager.getInstance().stop();
    };
  }, []);

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

  const characterEntries = Object.entries(characters);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 p-4 font-mono">
      <header className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-xl text-amber-500 font-bold uppercase tracking-widest">EVE Fleet Command</h1>
        <div className="flex gap-2">
          {!isMockMode && (
            <button 
              type="button" 
              onClick={() => window.location.href = '/auth/login'}
              className="border border-emerald-700 bg-emerald-950/30 text-emerald-400 px-4 py-1 hover:bg-emerald-900/50 transition-colors uppercase text-xs tracking-wider"
            >
              Add Clone
            </button>
          )}
          <button 
            type="button" 
            onClick={toggleMockMode}
            className="border border-cyan-700 bg-cyan-950/30 text-cyan-400 px-4 py-1 hover:bg-cyan-900/50 transition-colors uppercase text-xs tracking-wider"
          >
            Mock Mode: {isMockMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </header>
      
      {characterEntries.length === 0 ? (
        <div className="border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
          NO CLONES CONNECTED. AWAITING NEURAL LINK.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {characterEntries.map(([id, status]) => (
            <CharacterRow 
              key={id} 
              characterName={id} 
              status={status} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
