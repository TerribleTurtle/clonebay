import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  walletYellowThreshold: number;
  walletRedThreshold: number;
  setWalletYellowThreshold: (val: number) => void;
  setWalletRedThreshold: (val: number) => void;
  resetToDefaults: () => void;
  consentStatus: "granted" | "denied" | "unknown";
  setConsentStatus: (val: "granted" | "denied" | "unknown") => void;
}

const DEFAULT_SETTINGS = {
  walletYellowThreshold: 500000000, // 500m
  walletRedThreshold: 100000000,    // 100m
  consentStatus: "unknown",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setWalletYellowThreshold: (val) => set({ walletYellowThreshold: val }),
      setWalletRedThreshold: (val) => set({ walletRedThreshold: val }),
      setConsentStatus: (val) => set({ consentStatus: val }),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'eve-dash-settings',
    }
  )
);


export const clearAllStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }
};
