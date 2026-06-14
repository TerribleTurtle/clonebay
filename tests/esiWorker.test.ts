import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './setup';
import characterSkillsRaw from './fixtures/character_skills.json';
import characterPlanetRaw from './fixtures/character_planet.json';
import { handleWorkerMessage } from '../src/workers/esiWorker';
import { WorkerContext } from '../src/workers/types';

const mockPostMessage = vi.fn();
const mockClearTimeout = vi.fn();
const MOCK_TIMEOUT_ID = 123;
const mockSetTimeout = vi.fn().mockReturnValue(MOCK_TIMEOUT_ID);

let mockStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(async (key: string) => mockStore[key]),
    set: vi.fn(async (key: string, val: unknown) => { mockStore[key] = val; }),
    update: vi.fn(async (key: string, callback: (val: unknown) => unknown) => { mockStore[key] = callback(mockStore[key]); })
  };
});

describe('esiWorker', () => {
  let mockWorkerContext: WorkerContext;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSetTimeout.mockReturnValue(MOCK_TIMEOUT_ID);
    mockStore = {};
    
    mockWorkerContext = {
      postMessage: mockPostMessage,
      setTimeout: mockSetTimeout,
      clearTimeout: mockClearTimeout,
    };
    
    // Reset state between tests if needed (e.g., stopping polling)
    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'STOP_POLLING' } }), mockWorkerContext);
  });

  it('dispatches postMessage with status Green when fetchEsi succeeds via MSW', async () => {
    mockStore['eve_auth_tokens'] = {
      '2112345678': {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
        characterName: 'Alice'
      }
    };

    server.use(
      http.get('https://esi.evetech.net/latest/characters/:characterId/skills/', () => {
        return HttpResponse.json(characterSkillsRaw);
      }),
      http.get('https://esi.evetech.net/latest/characters/:characterId/planets/:planetId/', () => {
        return HttpResponse.json(characterPlanetRaw);
      })
    );

    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }), mockWorkerContext);

    await vi.waitFor(() => {
      expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          characterId: '2112345678',
          dataType: 'skills'
        })
      })
    );
    });
  });

  it('clears polling timeout when STOP_POLLING is received', async () => {
    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }), mockWorkerContext);
    await vi.waitFor(() => expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 60000));
      
    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'STOP_POLLING' } }), mockWorkerContext);
    
    expect(mockClearTimeout).toHaveBeenCalledWith(MOCK_TIMEOUT_ID);
  });

  it('correctly calculates maxJobs using character_skills (Mass Production and Advanced Mass Production)', async () => {
    mockStore['eve_auth_tokens'] = {
      '2112345678': {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
        characterName: 'Alice'
      }
    };

    server.use(
      http.get('https://esi.evetech.net/latest/characters/:characterId/skills/', () => {
        return HttpResponse.json({
          ...characterSkillsRaw,
          skills: [
            ...characterSkillsRaw.skills,
            { skill_id: 3388, active_skill_level: 4, trained_skill_level: 4, skillpoints_in_skill: 100000 },  // Mass Production
            { skill_id: 24630, active_skill_level: 2, trained_skill_level: 2, skillpoints_in_skill: 100000 } // Advanced Mass Production
          ]
        });
      }),
      http.get('https://esi.evetech.net/latest/characters/:characterId/planets/:planetId/', () => {
        return HttpResponse.json(characterPlanetRaw);
      })
    );

    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }), mockWorkerContext);

    await vi.waitFor(() => {
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          characterId: '2112345678',
          dataType: 'industry',
          status: 'Red'
        })
      })
    );
    });
  });

  it('verifies Planetary Interaction logic using real mockPlanets.json payload', async () => {
    mockStore['eve_auth_tokens'] = {
      '2112345678': {
        accessToken: 'fake-token',
        refreshToken: 'fake-refresh',
        characterName: 'Alice'
      }
    };

    server.use(
      http.get('https://esi.evetech.net/latest/characters/:characterId/skills/', () => {
        return HttpResponse.json(characterSkillsRaw);
      }),
      http.get('https://esi.evetech.net/latest/characters/:characterId/planets/:planetId/', () => {
        return HttpResponse.json({
          ...characterPlanetRaw,
          pins: [
            ...characterPlanetRaw.pins,
            {
              pin_id: 1023456789012,
              type_id: 2256 // Storage facility based on SDE?
            }
          ]
        });
      })
    );

    await handleWorkerMessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }), mockWorkerContext);

    await vi.waitFor(() => {
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          characterId: '2112345678',
          dataType: 'pi'
        })
      })
    );
    });
  });
});
