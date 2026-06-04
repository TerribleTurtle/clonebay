import * as AuthRepository from '../auth/AuthRepository';
import { useCharacterStore } from '../store/useCharacterStore';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { logger } from '../utils/logger';

export class CharacterService {
  static async removeAndReload(id: string): Promise<void> {
    try {
      await AuthRepository.removeCharacter(id);
      useCharacterStore.getState().deleteCharacterState(id);
      window.location.reload();
    } catch (error) {
      logger.error(`Failed to remove character ${id}:`, error);
      throw error;
    }
  }

  static async toggleMockMode(currentMode: boolean): Promise<void> {
    try {
      const newMockMode = !currentMode;
      SettingsRepository.setMockMode(newMockMode);
      useCharacterStore.getState().clearAll();
      window.location.reload();
    } catch (error) {
      logger.error("Failed to toggle mock mode:", error);
      throw error;
    }
  }
}
