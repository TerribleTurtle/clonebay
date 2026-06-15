import { create } from 'zustand';


export interface SettingsState {
  walletYellowThreshold: number;
  walletRedThreshold: number;
  isMockMode: boolean;
  setWalletYellowThreshold: (val: number) => void;
  setWalletRedThreshold: (val: number) => void;
  setMockMode: (val: boolean) => void;
  resetToDefaults: () => void;

}

const DEFAULT_SETTINGS = {
  walletYellowThreshold: 500000000, // 500m
  walletRedThreshold: 100000000,    // 100m
  isMockMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  (set) => ({
    ...DEFAULT_SETTINGS,
    setWalletYellowThreshold: (val) => set({ walletYellowThreshold: val }),
    setWalletRedThreshold: (val) => set({ walletRedThreshold: val }),
    setMockMode: (val) => set({ isMockMode: val }),

    resetToDefaults: () => set(DEFAULT_SETTINGS),
  })
);

