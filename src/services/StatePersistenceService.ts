import { useBoundStore, serializeCharacterState } from '../store/useBoundStore';
import { useCharacterConfigStore } from '../store/useCharacterConfigStore';
import { useLogStore } from '../store/useLogStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { safeLocalStorage } from '../utils/storageAdapter';
import { logger } from '../utils/logger';

const DEBOUNCE_MS = 1000;

// Debounce wrapper
function debounce<Args extends unknown[]>(func: (...args: Args) => void, wait: number): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: unknown, ...args: Args) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export class StatePersistenceService {
  private static unsubscribes: Array<() => void> = [];

  private static saveStoreDebounced = debounce((key: string, state: unknown) => {
    try {
      safeLocalStorage.setItem(key, JSON.stringify({ state, version: 0 }));
    } catch (e) {
      logger.error(`Failed to save store ${key}`, e);
    }
  }, DEBOUNCE_MS);

  static init() {
    this.hydrate();
    this.subscribe();
  }

  static cleanup() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }

  static hydrate() {
    this.hydrateStore('clonebay-storage', useBoundStore);
    this.hydrateStore('eve-character-config-storage', useCharacterConfigStore);
    this.hydrateStore('eve-log-store', useLogStore);
    this.hydrateStore('clonebay-settings', useSettingsStore);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-restricted-syntax
  private static hydrateStore(key: string, store: any) {
    const data = safeLocalStorage.getItem(key);
    if (data) {
      try {
        // eslint-disable-next-line no-restricted-syntax
        const parsed = JSON.parse(data);
        if (parsed && parsed.state) {
          store.setState(parsed.state);
        }
      } catch (e) {
        logger.error(`Failed to hydrate store ${key}`, e);
      }
    }
  }

  static subscribe() {
    this.cleanup();

    this.unsubscribes.push(
      useBoundStore.subscribe((state) => {
        const serialized = serializeCharacterState(state);
        this.saveStoreDebounced('clonebay-storage', serialized);
      })
    );

    this.unsubscribes.push(
      useCharacterConfigStore.subscribe((state) => {
        this.saveStoreDebounced('eve-character-config-storage', state);
      })
    );

    this.unsubscribes.push(
      useLogStore.subscribe((state) => {
        this.saveStoreDebounced('eve-log-store', state);
      })
    );

    this.unsubscribes.push(
      useSettingsStore.subscribe((state) => {
        this.saveStoreDebounced('clonebay-settings', state);
      })
    );
  }
}
