import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { EsiClones, EsiFatigue, EsiTransaction, EsiShip, EsiLocation, EsiMailLabels, EsiContract, EsiMarketOrder } from '../schemas/esi';

export type StatusLight = 'Green' | 'Yellow' | 'Red' | 'Offline';

export const DEFAULT_OFFLINE_STATUS = {
  skills: 'Offline',
  industry: 'Offline',
  pi: 'Offline',
  walletStatus: 'Offline',
  mailStatus: 'Offline',
  cloneStatus: 'Offline',
  locationStatus: 'Offline'
} as const;

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
  walletStatus: StatusLight;
  mailStatus: StatusLight;
  cloneStatus: StatusLight;
  locationStatus: StatusLight;
  clones?: EsiClones;
  fatigue?: EsiFatigue;
  transactions?: { count: number } | EsiTransaction[];
  mail?: EsiMailLabels;
  contracts?: { count: number } | EsiContract[];
  marketOrders?: { count: number } | EsiMarketOrder[];
}

/**
 * Represents the global application state for managing character data.
 */
export interface CharacterStoreState {
  /**
   * A dictionary containing the status of all characters, keyed by character ID.
   */
  characters: Record<string, CharacterStatus>;
  
  /**
   * The timestamp of the last successful polling operation, or null if never polled.
   */
  lastPolled: number | null;
  
  /**
   * Updates the status of a specific character with partial payload data.
   * 
   * @param id - The unique character ID.
   * @param payload - Partial character status updates to apply.
   */
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
  
  /**
   * Updates the status of multiple characters simultaneously.
   * 
   * @param updates - A record mapping character IDs to their partial status updates.
   */
  updateMultipleCharacters: (updates: Record<string, Partial<CharacterStatus>>) => void;
  
  /**
   * Deletes a character's state from the store.
   * 
   * @param id - The character ID to remove.
   */
  deleteCharacterState: (id: string) => void;
  
  /**
   * Sets the timestamp for the last polling operation.
   * 
   * @param timestamp - The exact time in milliseconds since the epoch.
   */
  setLastPolled: (timestamp: number) => void;
  
  /**
   * Sets all tracking lights (skills, industry, etc.) to 'Offline' for all characters.
   */
  setAllOffline: () => void;
  
  /**
   * Clears the entire character state, removing all characters.
   */
  clearAll: () => void;
}

export const useCharacterStore = create<CharacterStoreState>()(
  persist(
    (set) => ({
      characters: {},
      lastPolled: null,
      setLastPolled: (timestamp) => set({ lastPolled: timestamp }),
      deleteCharacterState: (id) => {
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
              ...DEFAULT_OFFLINE_STATUS
            };
          }
          return { characters: offlineChars };
        }),
      updateMultipleCharacters: (updates) =>
        set((state) => {
          const nextChars = { ...state.characters };
          for (const [id, payload] of Object.entries(updates)) {
            const existing = nextChars[id] ?? { ...DEFAULT_OFFLINE_STATUS };
            nextChars[id] = { ...existing, ...payload };
          }
          return { characters: nextChars };
        }),
      updateCharacterStatus: (id, payload) =>
        set((state) => {
          const existing = state.characters[id] ?? { ...DEFAULT_OFFLINE_STATUS };
          
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { transactions, mail, contracts, marketOrders, ...rest } = char;
            return [id, rest];
          })
        ),
      }),
    }
  )
);

