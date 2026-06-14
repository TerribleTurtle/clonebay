import { logger } from '../utils/logger';

export const SettingsRepository = {
  getMockMode: (): boolean => {
    try {
      return localStorage.getItem('eve_mock_mode') === 'true';
    } catch (error) {
      logger.error("Failed to read eve_mock_mode from localStorage:", error);
      throw error;
    }
  },

  setMockMode: (mode: boolean): void => {
    try {
      localStorage.setItem('eve_mock_mode', String(mode));
    } catch (error) {
      logger.error("Failed to write eve_mock_mode to localStorage:", error);
      throw error;
    }
  }
};
