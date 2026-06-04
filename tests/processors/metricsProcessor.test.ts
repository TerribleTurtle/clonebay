import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMetrics, type EsiMetricsContext } from '../../src/workers/processors/metricsProcessor';

vi.mock('../../src/services/esi/sdeClient', () => ({
  fetchSdeSystem: vi.fn().mockResolvedValue('Jita')
}));

describe('metricsProcessor', () => {
  let mockPostMessage: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    vi.useFakeTimers();
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
      postMessage: mockPostMessage
    };

    await processMetrics(context);

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

  it('should post Red statuses on error', async () => {
    const context: EsiMetricsContext = {
      charId: 'char-1',
      charName: 'Test Char',
      charSkillsResult: undefined,
      walletResult: {
        status: 'Green',
        cached: false,
        get data(): any { throw new Error('Forced Error Inside Try'); }
      },
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
      postMessage: mockPostMessage
    };

    await processMetrics(context);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_METRICS_UPDATE',
      payload: {
        characterId: 'char-1',
        walletStatus: 'Red',
        locationStatus: 'Red',
        mailStatus: 'Red',
        cloneStatus: 'Red'
      }
    });
  });
});
