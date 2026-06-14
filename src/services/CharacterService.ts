import * as AuthRepository from '../auth/AuthRepository';
import { useBoundStore } from '../store/useBoundStore';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { logger } from '../utils/logger';

export class CharacterService {
  static async removeAndReload(id: string): Promise<void> {
    try {
      await AuthRepository.removeCharacter(id);
      useBoundStore.getState().deleteCharacterState(id);
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
      useBoundStore.getState().clearAll();
      window.location.reload();
    } catch (error) {
      logger.error("Failed to toggle mock mode:", error);
      throw error;
    }
  }
}
