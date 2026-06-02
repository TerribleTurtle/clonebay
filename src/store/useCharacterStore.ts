import { create } from 'zustand';

export type StatusLight = 'Green' | 'Yellow' | 'Red' | 'Offline';

export interface CharacterStatus {
  skills: StatusLight;
  industry: StatusLight;
  pi: StatusLight;
}

export interface CharacterStoreState {
  characters: Record<string, CharacterStatus>;
  updateCharacterStatus: (id: string, payload: Partial<CharacterStatus>) => void;
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  characters: {},
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
