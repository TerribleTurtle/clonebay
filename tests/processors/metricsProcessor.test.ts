import type { IEsiService } from '../../src/services/esi/IEsiService';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processMetrics, type EsiMetricsContext } from '../../src/workers/processors/metricsProcessor';

import { fetchSdeSystem } from '../../src/services/esi/sdeClient';

vi.mock('../../src/services/esi/sdeClient', () => ({
  fetchSdeSystem: vi.fn()
}));

describe('metricsProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    vi.useFakeTimers();
    vi.mocked(fetchSdeSystem).mockResolvedValue('Jita');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('should post ESI_METRICS_UPDATE with computed statuses', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const context: EsiMetricsContext = {
      charId: 'char-1',
      charName: 'Test Char',
      charSkillsResult: undefined,
      walletResult: { status: 'Green', cached: false, data: 500000000 },
      locationResult: { status: 'Green', cached: false, data: { solar_system_id: 30000142, station_id: 60003760 } },
      shipResult: undefined,
      skillsResult: undefined,
      clonesResult: undefined,
      fatigueResult: undefined,
      transactionsResult: undefined,
      mailLabelsResult: undefined,
      contractsResult: undefined,
      marketOrdersResult: undefined,
      isMockMode: false,
      postMessage: mockPostMessage,
      esiService: {} as unknown as IEsiService,
      accessToken: 'token'
    };

    const promise = processMetrics(context);
    await vi.runAllTimersAsync();
    await promise;

    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'ESI_METRICS_UPDATE',
      payload: expect.objectContaining({
        characterId: 'char-1',
        walletStatus: expect.any(String),
        locationStatus: expect.any(String),
        mailStatus: expect.any(String),
        cloneStatus: expect.any(String)
      })
    }));
  });

  it('should handle upstream service rejected promise gracefully', async () => {
    const context: EsiMetricsContext = {
      charId: 'char-1',
      charName: 'Test Char',
      charSkillsResult: undefined,
      walletResult: { status: 'Green', cached: false, data: 500000000 },
      locationResult: undefined,
      shipResult: undefined,
      skillsResult: undefined,
      clonesResult: undefined,
      fatigueResult: undefined,
      transactionsResult: undefined,
      mailLabelsResult: undefined,
      contractsResult: undefined,
      marketOrdersResult: undefined,
      isMockMode: false,
      postMessage: mockPostMessage,
      esiService: {
        getMail: vi.fn().mockRejectedValue(new Error('Upstream error')),
        getAttributes: vi.fn().mockResolvedValue({ data: {} })
      } as unknown as IEsiService,
      accessToken: 'token'
    };

    await processMetrics(context);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_METRICS_UPDATE',
      payload: expect.objectContaining({
        characterId: 'char-1',
        walletStatus: 'Green',
        mailContext: undefined
      })
    });
  });
});
