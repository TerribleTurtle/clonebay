import { StateCreator } from 'zustand';
import { CharacterStatus, DEFAULT_OFFLINE_STATUS } from './types';

export interface CoreSlice {
  characters: Record<string, CharacterStatus>;
  lastPolled: number | null;
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
  updateMultipleCharacters: (updates: Record<string, Partial<CharacterStatus>>) => void;
  deleteCharacterState: (id: string) => void;
  setLastPolled: (timestamp: number) => void;
  setAllOffline: () => void;
  clearAll: () => void;
}

export const createCoreSlice: StateCreator<CoreSlice, [], [], CoreSlice> = (set) => ({
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
});
