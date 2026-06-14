import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCharacterData } from '../../src/workers/characterFetcher';
import { MockEsiService } from '../../src/services/esi/MockEsiService';
import { NameCacheService } from '../../src/services/NameCacheService';
import type { WorkerContext } from '../../src/workers/types';
import type { EsiResponse } from '../../src/services/esi/esiClient';
import type { EsiCorporationStructure } from '../../src/schemas/esi/corporation';
import type { Mock } from 'vitest';

describe('characterFetcher', () => {
  let mockWorkerContext: WorkerContext;
  let mockPostMessage: Mock<(msg: unknown) => void>;
  let mockEsiService: MockEsiService;
  let nameCache: NameCacheService;
  let structuresCache: Map<number, Promise<EsiResponse<EsiCorporationStructure[]> | null>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPostMessage = vi.fn((_msg: unknown) => {});
    mockWorkerContext = {
      postMessage: mockPostMessage,
      setTimeout: vi.fn((_cb: TimerHandler, _ms: number) => 0),
      clearTimeout: vi.fn((_id: number) => {}),
    };
    mockEsiService = new MockEsiService();
    nameCache = new NameCacheService(mockEsiService.universe);
    structuresCache = new Map();
  });

  it('catches and isolates errors in skills processor without throwing top-level error in Promise.allSettled', async () => {
    // We mock the getSkillQueue to reject, simulating a network or parsing error
    vi.spyOn(mockEsiService.skills, 'getSkillQueue').mockRejectedValue(new Error('Skill Queue Fetch Failed'));

    // To prevent other processors from failing and cluttering logs, we ensure they resolve
    vi.spyOn(mockEsiService.character, 'getCharacterNotifications').mockResolvedValue({ data: [], status: 'Green', cached: false });
    vi.spyOn(mockEsiService.wallet, 'getWalletJournal').mockResolvedValue({ data: [], status: 'Green', cached: false });

    // We expect fetchCharacterData to reject because of the Promise.all() encompassing the processing logic
    // Wait, let's look at fetchCharacterData. It uses Promise.all(), so it WILL throw, but first it will post Red status for the failed module!
    // The instructions say: "ensuring errors in one processor (like skills) are caught and isolated, posting a specific Red status back to the main thread without halting the entire worker loop."
    
    await expect(
      fetchCharacterData(
        'char-123',
        { accessToken: 'token', refreshToken: 'ref', characterName: 'Bob' },
        true, // isMockMode
        mockWorkerContext,
        mockEsiService,
        nameCache,
        structuresCache
      )
    ).resolves.toBeUndefined();

    // We should see a specific error message payload for the failing module before it rejected
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          characterId: 'char-123',
          dataType: 'skills',
          status: 'Red'
        })
      })
    );
  });
});
