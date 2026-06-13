/* eslint-disable no-restricted-syntax */
"use client";

import { useState } from 'react';
import { GeneralTab } from './GeneralTab';
import { ThresholdsTab } from './ThresholdsTab';
import { VisibilityTab } from './VisibilityTab';

export interface CharacterSettingsDialogProps {
  characterId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'General' | 'Thresholds' | 'Visibility';

export function CharacterSettingsDialog({
  characterId,
  isOpen,
  onClose,
}: CharacterSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('General');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono">
      <div className="w-full max-w-2xl border border-eve-border border-zinc-700 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
          <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-widest">
            Settings // {characterId}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-red-500 focus:outline-none"
            aria-label="Close dialog"
          >
            [X]
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row h-[600px] sm:h-[500px]">
          {/* Sidebar Tabs */}
          <div className="flex sm:flex-col w-full sm:w-48 space-x-1 sm:space-x-0 sm:space-y-1 overflow-x-auto border-b sm:border-b-0 sm:border-r border-zinc-800 bg-zinc-900/50 p-2 shrink-0">
            {(['General', 'Thresholds', 'Visibility'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none sm:w-full border-b-2 sm:border-b-0 sm:border-l-2 px-3 py-2 text-center sm:text-left text-sm uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                    : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 text-zinc-300">
            {activeTab === 'General' && <GeneralTab />}
            {activeTab === 'Thresholds' && <ThresholdsTab characterId={characterId} />}
            {activeTab === 'Visibility' && <VisibilityTab characterId={characterId} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 bg-zinc-900 p-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-zinc-800 px-6 py-3 sm:py-2 text-sm uppercase tracking-widest text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
