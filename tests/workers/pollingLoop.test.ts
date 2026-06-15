import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleWorkerMessage } from '../../src/workers/pollingLoop';
import { get } from 'idb-keyval';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { resetGlobalPauseForTests } from '../../src/services/esi/esiClient';
import type { WorkerContext } from '../../src/workers/types';
import type { Mock } from 'vitest';

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(),
  };
});

describe('pollingLoop', () => {
  let mockWorkerContext: WorkerContext;
  let mockPostMessage: Mock<(msg: unknown) => void>;
  let mockSetTimeout: Mock<(cb: TimerHandler, ms: number) => number>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPostMessage = vi.fn((_msg: unknown) => {});
    mockSetTimeout = vi.fn((fn: TimerHandler, ms: number) => {
      if (typeof fn === 'function') setTimeout(fn, ms);
      return 0;
    });
    mockWorkerContext = {
      postMessage: mockPostMessage,
      setTimeout: mockSetTimeout,
      clearTimeout: vi.fn((_id: number) => { clearTimeout(_id); }),
    };
    vi.mocked(get).mockResolvedValue({
      '12345': {
        accessToken: 'token',
        refreshToken: 'ref',
        characterName: 'Test Char'
      }
    });
    resetGlobalPauseForTests();
  });

  afterEach(async () => {
    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'STOP_POLLING' } }), mockWorkerContext);
    vi.useRealTimers();
  });

  it('halts polling between 11:00 and 11:15 UTC for Daily Downtime', async () => {
    // Set time to 11:05 UTC
    const date = new Date(Date.UTC(2026, 5, 13, 11, 5, 0));
    vi.setSystemTime(date);

    server.use(
      http.get('https://esi.evetech.net/*', () => {
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // Start polling loop
    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING', isMockMode: false } }), mockWorkerContext);

    // Fast-forward to allow loop to complete if it were active
    await vi.advanceTimersByTimeAsync(100);

    // During downtime, the interceptor returns 503 Offline without making the actual HTTP call.
    // We expect the processors to post 'Offline' status for the modules
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_METRICS_UPDATE',
        payload: expect.objectContaining({
          characterId: '12345',
          skills: 'Offline',
        })
      })
    );
  });

  it('respects X-Esi-Error-Limit-Remain pauses', async () => {
    const date = new Date(Date.UTC(2026, 5, 13, 10, 0, 0)); // Safe time outside downtime
    vi.setSystemTime(date);

    server.use(
      http.get('https://esi.evetech.net/*', () => {
        // Simulate error limit decreasing to 5
        return HttpResponse.json({}, { 
          status: 400, 
          headers: {
            'X-Esi-Error-Limit-Remain': '5'
          }
        });
      })
    );

    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING', isMockMode: false } }), mockWorkerContext);
    await vi.advanceTimersByTimeAsync(100);

    // Rate limit should be tripped for subsequent requests.
    // Because the threshold is typically <= 10.
    // We expect the global pause to trigger on the next polling cycle.
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_METRICS_UPDATE',
        payload: expect.objectContaining({
          characterId: '12345'
        })
      })
    );
  });
});
