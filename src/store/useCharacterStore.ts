import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  skills: StatusLight;
  industry: StatusLight;
  pi: StatusLight;
}

export interface CharacterStoreState {
  characters: Record<string, CharacterStatus>;
  lastPolled: number | null;
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
  removeCharacter: (id: string) => void;
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
      removeCharacter: (id) =>
        set((state) => {
          const newCharacters = { ...state.characters };
          delete newCharacters[id];
          return { characters: newCharacters };
        }),
      clearAll: () => set({ characters: {} }),
      setAllOffline: () => 
        set((state) => {
          const offlineChars: Record<string, CharacterStatus> = {};
          for (const id of Object.keys(state.characters)) {
            offlineChars[id] = { skills: 'Offline', industry: 'Offline', pi: 'Offline' };
          }
          return { characters: offlineChars };
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
    }
  )
);
