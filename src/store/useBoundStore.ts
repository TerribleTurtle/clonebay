import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCoreSlice, CoreSlice } from './slices/createCoreSlice';
import { createSkillsSlice, SkillsSlice } from './slices/createSkillsSlice';
import { createIndustrySlice, IndustrySlice } from './slices/createIndustrySlice';
import { CharacterStatus } from './slices/types';

export * from './slices/types';

export type BoundStoreState = CoreSlice & SkillsSlice & IndustrySlice;

export function serializeCharacterState(state: BoundStoreState): Partial<BoundStoreState> {
  return {
    ...state,
    characters: Object.fromEntries(
      Object.entries(state.characters).map(([id, char]) => {
        const { transactions, mail, contracts, marketOrders, ...rest } = char;
        const serializedChar: CharacterStatus = { ...rest };
        if (transactions) {
          serializedChar.transactions = { count: Array.isArray(transactions) ? transactions.length : transactions.count };
        }
        if (mail) {
          serializedChar.mail = { total_unread_count: mail.total_unread_count, labels: [] };
        }
        if (contracts) {
          serializedChar.contracts = { count: Array.isArray(contracts) ? contracts.length : contracts.count };
        }
        if (marketOrders) {
          serializedChar.marketOrders = { count: Array.isArray(marketOrders) ? marketOrders.length : marketOrders.count };
        }
        return [id, serializedChar];
      })
    ),
  };
}

export const useBoundStore = create<BoundStoreState>()(
  persist(
    (...a) => ({
      ...createCoreSlice(...a),
      ...createSkillsSlice(...a),
      ...createIndustrySlice(...a),
    }),
    {
      name: 'clonebay-storage',
      partialize: serializeCharacterState,
    }
  )
);
