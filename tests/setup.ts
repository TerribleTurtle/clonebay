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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
