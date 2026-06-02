import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addOrUpdateCharacter, getAuthDictionary } from '../src/utils/authStorage';

let mockStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => {
  return {
    get: vi.fn(async (key: string) => mockStore[key]),
    set: vi.fn(async (key: string, val: unknown) => { mockStore[key] = val; }),
    update: vi.fn(async (key: string, updater: (val: unknown) => unknown) => {
      mockStore[key] = updater(mockStore[key]);
    })
  };
});

describe('authStorage', () => {
  beforeEach(() => {
    mockStore = {};
    vi.clearAllMocks();
  });

  it('addOrUpdateCharacter merges tokens without deleting old ones', async () => {
    await addOrUpdateCharacter('char1', {
      accessToken: 'token1',
      refreshToken: 'refresh1',
      characterName: 'Alice'
    });

    await addOrUpdateCharacter('char2', {
      accessToken: 'token2',
      refreshToken: 'refresh2',
      characterName: 'Bob'
    });

    const dict = await getAuthDictionary();
    
    expect(dict).toBeDefined();
    expect(dict!['char1']).toBeDefined();
    expect(dict!['char1']!.characterName).toBe('Alice');
    
    expect(dict!['char2']).toBeDefined();
    expect(dict!['char2']!.characterName).toBe('Bob');
    
    const EXPECTED_DICT_LENGTH = 2;
    expect(Object.keys(dict!).length).toBe(EXPECTED_DICT_LENGTH);
  });
});
