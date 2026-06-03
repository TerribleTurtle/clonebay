import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set as idbSet } from 'idb-keyval';

import { EsiClones, EsiFatigue, EsiTransaction, EsiShip, EsiLocation, EsiMailLabels, EsiContract } from '../schemas/esi';

export type StatusLight = 'Green' | 'Yellow' | 'Red' | 'Offline';

export interface CharacterStatus {
  name?: string;
  isk?: number;
  totalSp?: number;
  unallocatedSp?: number;
  locationId?: number;
  locationName?: string;
  stationId?: number;
  structureId?: number;
  location?: EsiLocation;
  ship?: EsiShip;
  skills: StatusLight;
  industry: StatusLight;
  pi: StatusLight;
  clones?: EsiClones;
  fatigue?: EsiFatigue;
  transactions?: EsiTransaction[];
  mail?: EsiMailLabels;
  contracts?: EsiContract[];
}

export interface CharacterStoreState {
  characters: Record<string, CharacterStatus>;
  lastPolled: number | null;
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
  updateMultipleCharacters: (updates: Record<string, Partial<CharacterStatus>>) => void;
  removeCharacter: (id: string) => Promise<void>;
  setLastPolled: (timestamp: number) => void;
  setAllOffline: () => void;
  clearAll: () => void;
}

export const useCharacterStore = create<CharacterStoreState>()(
  persist(
    (set) => ({
      characters: {},
      lastPolled: null,
      setLastPolled: (timestamp) => set({ lastPolled: timestamp }),
      removeCharacter: async (id) => {
        try {
          const tokens = await get<Record<string, unknown>>('eve_auth_tokens') || {};
          delete tokens[id];
          await idbSet('eve_auth_tokens', tokens);
        } catch (error) {
          console.error(`Failed to remove token for ${id}:`, error);
          throw error;
        }
        set((state) => {
          const newCharacters = { ...state.characters };
          delete newCharacters[id];
          return { characters: newCharacters };
        });
      },
      clearAll: () => set({ characters: {} }),
      setAllOffline: () => 
        set((state) => {
          const offlineChars: Record<string, CharacterStatus> = {};
          for (const id of Object.keys(state.characters)) {
            offlineChars[id] = { 
              ...state.characters[id],
              skills: 'Offline', 
              industry: 'Offline', 
              pi: 'Offline' 
            };
          }
          return { characters: offlineChars };
        }),
      updateMultipleCharacters: (updates) =>
        set((state) => {
          const nextChars = { ...state.characters };
          for (const [id, payload] of Object.entries(updates)) {
            const existing = nextChars[id] ?? { skills: 'Offline', industry: 'Offline', pi: 'Offline' };
            nextChars[id] = { ...existing, ...payload };
          }
          return { characters: nextChars };
        }),
      updateCharacterStatus: (id, payload) =>
        set((state) => {
          const existing = state.characters[id] ?? {
            skills: 'Offline',
            industry: 'Offline',
            pi: 'Offline',
          };
          
          return {
            characters: {
              ...state.characters,
              [id]: {
                ...existing,
                ...payload,
              },
            },
          };
        }),
    }),
    {
      name: 'eve-dashboard-storage',
      partialize: (state) => ({
        ...state,
        characters: Object.fromEntries(
          Object.entries(state.characters).map(([id, char]) => {
            const { transactions, mail, contracts, ...rest } = char;
            return [id, rest];
          })
        ),
      }),
    }
  )
);
