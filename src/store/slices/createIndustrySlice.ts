import { StateCreator } from 'zustand';
import { CharacterStatus } from './types';
import { CoreSlice } from './createCoreSlice';

export interface IndustrySlice {
  updateIndustryStatus: (id: string, payload: Partial<Pick<CharacterStatus, 'industry' | 'indyContext' | 'marketOrders' | 'ordersContext'>>) => void;
}

export const createIndustrySlice: StateCreator<CoreSlice & IndustrySlice, [], [], IndustrySlice> = (set) => ({
  updateIndustryStatus: (id, payload) =>
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
