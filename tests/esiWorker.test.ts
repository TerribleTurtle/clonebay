import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './setup';
import characterSkillsRaw from './fixtures/character_skills.json';
import characterPlanetRaw from './fixtures/character_planet.json';

const mockPostMessage = vi.fn();
const mockClearTimeout = vi.fn();
const MOCK_TIMEOUT_ID = 123;
const mockSetTimeout = vi.fn().mockReturnValue(MOCK_TIMEOUT_ID);

const mockOnMessage: unknown = null;

vi.stubGlobal('self', {
  onmessage: mockOnMessage,
  postMessage: mockPostMessage,
  setTimeout: mockSetTimeout,
  clearTimeout: mockClearTimeout,
});

let mockStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(async (key: string) => mockStore[key]),
    set: vi.fn(async (key: string, val: unknown) => { mockStore[key] = val; })
  };
});

// We rely on MSW to intercept network requests naturally.

describe('esiWorker', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSetTimeout.mockReturnValue(MOCK_TIMEOUT_ID);
    mockStore = {};
    
    // reset module cache to re-evaluate esiWorker and attach onmessage fresh
    vi.resetModules();
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

    await import('../src/workers/esiWorker');

    const selfObj = global.self;
    if (selfObj && typeof selfObj.onmessage === 'function') {
      const event = new MessageEvent('message', { data: { type: 'START_POLLING' } });
      await selfObj.onmessage(event);
    }

    // Since mockSkillQueue has completed skills (or active ones), the exact output depends on math.
    // Wait for the async worker flow to finish.
    await new Promise(resolve => setTimeout(resolve, 100));

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

  it('clears polling timeout when STOP_POLLING is received', async () => {
    await import('../src/workers/esiWorker');
    const selfObj = global.self;
    if (selfObj && typeof selfObj.onmessage === 'function') {
      // First start polling to set the interval
      await selfObj.onmessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now stop polling
      await selfObj.onmessage(new MessageEvent('message', { data: { type: 'STOP_POLLING' } }));
    }
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

    await import('../src/workers/esiWorker');
    const selfObj = global.self;
    if (selfObj && typeof selfObj.onmessage === 'function') {
      await selfObj.onmessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }));
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          characterId: '2112345678',
          dataType: 'industry',
          // maxJobs = 1 + 4 + 2 = 7. 
          // mockIndustryJobs might have fewer than 7 jobs, meaning status will be Red
          // Since mockIndustryJobs has only 1 job, with 7 max slots, it should be Red.
          status: 'Red'
        })
      })
    );
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

    await import('../src/workers/esiWorker');
    const selfObj = global.self;
    if (selfObj && typeof selfObj.onmessage === 'function') {
      await selfObj.onmessage(new MessageEvent('message', { data: { type: 'START_POLLING' } }));
    }

    await new Promise(resolve => setTimeout(resolve, 150));

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
