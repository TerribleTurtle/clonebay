import { StateCreator } from 'zustand';
import { CharacterStatus } from './types';
import { CoreSlice } from './createCoreSlice';

export interface SkillsSlice {
  updateSkillsStatus: (id: string, payload: Partial<Pick<CharacterStatus, 'skills' | 'skillsContext' | 'spContext' | 'totalSp' | 'unallocatedSp'>>) => void;
}

export const createSkillsSlice: StateCreator<CoreSlice & SkillsSlice, [], [], SkillsSlice> = (set) => ({
  updateSkillsStatus: (id, payload) =>
    set((state) => {
      const existing = state.characters[id];
      if (!existing) return state;

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
