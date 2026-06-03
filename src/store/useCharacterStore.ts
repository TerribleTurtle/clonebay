import { create } from 'zustand';

export type StatusLight = 'Green' | 'Yellow' | 'Red' | 'Offline';

export interface CharacterStatus {
  skills: StatusLight;
  industry: StatusLight;
  pi: StatusLight;
}

export interface CharacterStoreState {
  characters: Record<string, CharacterStatus>;
  lastPolled: number | null;
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
  setLastPolled: (timestamp: number) => void;
  setAllOffline: () => void;
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  characters: {},
  lastPolled: null,
  setLastPolled: (timestamp) => set({ lastPolled: timestamp }),
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
}));
