import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';

if (typeof Worker === 'undefined') {
  global.Worker = class Worker {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  } as unknown as typeof global.Worker;
}

import { handlers } from './handlers';

export const server = setupServer(...handlers);

import { vi } from 'vitest';
vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Global fetch called without explicit mock!'); }));
global.postMessage = vi.fn();

import { useCharacterStore } from '../src/store/useCharacterStore';
import { useCharacterConfigStore } from '../src/store/useCharacterConfigStore';
import { useLogStore } from '../src/store/useLogStore';
import { useSettingsStore } from '../src/store/useSettingsStore';

const initialCharacterState = useCharacterStore.getState();
const initialCharacterConfigState = useCharacterConfigStore.getState();
const initialLogState = useLogStore.getState();
const initialSettingsState = useSettingsStore.getState();

export const resetAllZustandStores = () => {
  useCharacterStore.setState(initialCharacterState, true);
  useCharacterConfigStore.setState(initialCharacterConfigState, true);
  useLogStore.setState(initialLogState, true);
  useSettingsStore.setState(initialSettingsState, true);
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetAllZustandStores();
});
afterAll(() => server.close());
