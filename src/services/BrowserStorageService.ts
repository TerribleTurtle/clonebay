import { createJSONStorage } from 'zustand/middleware';
import { dummyStorage } from '../utils/storageAdapter';
import { logger } from '../utils/logger';

export class BrowserStorageService {
  static clearAllStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  static getZustandStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return createJSONStorage(() => window.localStorage);
      }
    } catch (e: unknown) {
      logger.error('Failed to access localStorage:', e);
      throw e;
    }
    return createJSONStorage(() => dummyStorage);
  }
}
