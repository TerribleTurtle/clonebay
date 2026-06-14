import { logger } from './logger';

export const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    } catch (e) {
      logger.error('Failed to get item from localStorage', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      }
    } catch (e) {
      logger.error('Failed to set item in localStorage', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      }
    } catch (e) {
      logger.error('Failed to remove item from localStorage', e);
    }
  },
};

export const safeSessionStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.sessionStorage.getItem(name);
    } catch (e) {
      logger.error('Failed to get item from sessionStorage', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(name, value);
      }
    } catch (e) {
      logger.error('Failed to set item in sessionStorage', e);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(name);
      }
    } catch (e) {
      logger.error('Failed to remove item from sessionStorage', e);
    }
  },
};

export const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
