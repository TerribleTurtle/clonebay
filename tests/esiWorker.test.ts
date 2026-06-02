import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPostMessage = vi.fn();
const mockClearInterval = vi.fn();
const MOCK_INTERVAL_ID = 123;
const mockSetInterval = vi.fn().mockReturnValue(MOCK_INTERVAL_ID);

const mockOnMessage: unknown = null;

vi.stubGlobal('self', {
  onmessage: mockOnMessage,
  postMessage: mockPostMessage,
  setInterval: mockSetInterval,
  clearInterval: mockClearInterval,
});

let mockStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(async (key: string) => mockStore[key])
  };
});

vi.mock('../src/utils/esiClient', () => {
  return {
    fetchEsi: vi.fn()
  };
});

describe('esiWorker', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore = {};
    
    // reset module cache to re-evaluate esiWorker and attach onmessage fresh
    vi.resetModules();
  });

  it('dispatches postMessage with status Red when fetchEsi throws an error', async () => {
    mockStore['eve_auth_tokens'] = {
      'char1': {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
        characterName: 'Alice'
      }
    };

    const { fetchEsi } = await import('../src/utils/esiClient');
    vi.mocked(fetchEsi).mockRejectedValue(new Error('Network Error'));

    await import('../src/workers/esiWorker');

    const selfObj = global.self;
    if (selfObj && typeof selfObj.onmessage === 'function') {
      // @ts-expect-error Mocking MessageEvent without full DOM implementation
      await selfObj.onmessage({ data: { type: 'START_POLLING' } });
    }

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: {
        characterId: 'char1',
        dataType: 'skills',
        status: 'Red',
        data: null
      }
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: {
        characterId: 'char1',
        dataType: 'industry',
        status: 'Red',
        data: null
      }
    });
  });
});
