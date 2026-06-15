import { create } from 'zustand';

import { createCoreSlice, CoreSlice } from './slices/createCoreSlice';
import { createSkillsSlice, SkillsSlice } from './slices/createSkillsSlice';
import { createIndustrySlice, IndustrySlice } from './slices/createIndustrySlice';
import { CharacterStatus } from './slices/types';

export * from './slices/types';

export type BoundStoreState = CoreSlice & SkillsSlice & IndustrySlice;

let lastState: BoundStoreState | null = null;
let lastSerialized: Partial<BoundStoreState> | null = null;
let lastCharacters: Record<string, CharacterStatus> | null = null;
let serializedCharacters: Record<string, CharacterStatus> = {};

export function serializeCharacterState(state: BoundStoreState): Partial<BoundStoreState> {
  if (state === lastState && lastSerialized) return lastSerialized;
  lastState = state;

  if (state.characters === lastCharacters && lastSerialized) {
     return lastSerialized;
  }
  
  const newSerializedCharacters: Record<string, CharacterStatus> = {};
  for (const id in state.characters) {
    const char = state.characters[id];
    const prevSerialized = serializedCharacters[id];
    if (lastCharacters && char === lastCharacters[id] && prevSerialized) {
       newSerializedCharacters[id] = prevSerialized;
    } else if (char) {
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
        newSerializedCharacters[id] = serializedChar;
    }
  }

  lastCharacters = state.characters;
  serializedCharacters = newSerializedCharacters;
  
  lastSerialized = {
    ...state,
    characters: newSerializedCharacters,
  };
  return lastSerialized;
}

export const useBoundStore = create<BoundStoreState>()(
  (...a) => ({
    ...createCoreSlice(...a),
    ...createSkillsSlice(...a),
    ...createIndustrySlice(...a),
  })
);
