import { create } from 'zustand';


export interface CharacterVisibility {
  trackSkills: boolean;
  trackPi: boolean;
  trackIndy: boolean;
  trackMail: boolean;
  trackWar?: boolean;
}

export interface CharacterOverrides {
  walletYellow?: number;
  walletRed?: number;
}

export interface CharacterConfig {
  visibility: CharacterVisibility;
  overrides: CharacterOverrides;
}

interface CharacterConfigState {
  configs: Record<string, CharacterConfig>;
  setOverride: (charId: string, key: keyof CharacterOverrides, value: number) => void;
  clearOverride: (charId: string, key: keyof CharacterOverrides) => void;
  setVisibility: (charId: string, key: keyof CharacterVisibility, value: boolean) => void;
}

const getDefaultConfig = (): CharacterConfig => ({
  visibility: {
    trackSkills: true,
    trackPi: true,
    trackIndy: true,
    trackMail: true,
    trackWar: true,
  },
  overrides: {}
});



export const useCharacterConfigStore = create<CharacterConfigState>()(
  (set) => ({
    configs: {},
    setOverride: (charId, key, value) =>
      set((state) => {
        const charConfig = state.configs[charId] || getDefaultConfig();
        return {
          configs: {
            ...state.configs,
            [charId]: {
              ...charConfig,
              overrides: {
                ...charConfig.overrides,
                [key]: value,
              },
            },
          },
        };
      }),
    clearOverride: (charId, key) =>
      set((state) => {
        if (!state.configs[charId]) return state;
        const charConfig = state.configs[charId];
        const newOverrides = { ...charConfig.overrides };
        delete newOverrides[key];
        return {
          configs: {
            ...state.configs,
            [charId]: {
              ...charConfig,
              overrides: newOverrides,
            },
          },
        };
      }),
    setVisibility: (charId, key, value) =>
      set((state) => {
        const charConfig = state.configs[charId] || getDefaultConfig();
        return {
          configs: {
            ...state.configs,
            [charId]: {
              ...charConfig,
              visibility: {
                ...charConfig.visibility,
                [key]: value,
              },
            },
          },
        };
      }),
  })
);
