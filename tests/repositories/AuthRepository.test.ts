import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addOrUpdateCharacter, getAuthDictionary, setAuthDictionary, removeCharacter, StorageError } from '../../src/auth/AuthRepository';
import { clear } from 'idb-keyval';
import 'fake-indexeddb/auto';

let failIdb = false;
vi.mock('idb-keyval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('idb-keyval')>();
  return {
    ...actual,
    get: async (...args: Parameters<typeof actual.get>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.get(...args);
    },
    set: async (...args: Parameters<typeof actual.set>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.set(...args);
    },
    update: async (...args: Parameters<typeof actual.update>) => {
      if (failIdb) throw new Error('Simulated IDB error');
      return actual.update(...args);
    }
  };
});

describe('AuthRepository', () => {
  beforeEach(async () => {
    failIdb = false;
    await clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns empty dictionary when no data exists', async () => {
    const dict = await getAuthDictionary();
    expect(dict).toEqual({});
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
    
    if (dict === undefined) {
      throw new Error('Dictionary should be defined');
    }
    
    const char1Data = dict['char1'];
    if (char1Data === undefined) {
      throw new Error('char1 should be defined');
    }
    expect(char1Data.characterName).toBe('Alice');
    
    const char2Data = dict['char2'];
    if (char2Data === undefined) {
      throw new Error('char2 should be defined');
    }
    expect(char2Data.characterName).toBe('Bob');
    
    const EXPECTED_DICT_LENGTH = 2;
    expect(Object.keys(dict).length).toBe(EXPECTED_DICT_LENGTH);
  });

  it('setAuthDictionary overwrites the entire dictionary', async () => {
    await setAuthDictionary({
      'char3': {
        accessToken: 'token3',
        refreshToken: 'refresh3',
        characterName: 'Charlie'
      }
    });

    const dict = await getAuthDictionary();
    expect(Object.keys(dict).length).toBe(1);
    expect(dict['char3']?.characterName).toBe('Charlie');
  });

  it('removeCharacter removes only the specified character', async () => {
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

    await removeCharacter('char1');

    const dict = await getAuthDictionary();
    expect(Object.keys(dict).length).toBe(1);
    expect(dict['char1']).toBeUndefined();
    expect(dict['char2']?.characterName).toBe('Bob');
  });

  it('fails loudly with StorageError on IDB read failure', async () => {
    failIdb = true;
    await expect(getAuthDictionary()).rejects.toThrow(StorageError);
  });

  it('fails loudly with StorageError on IDB write failure', async () => {
    failIdb = true;
    await expect(addOrUpdateCharacter('char1', {
      accessToken: 'token',
      refreshToken: 'refresh',
      characterName: 'Alice'
    })).rejects.toThrow(StorageError);
  });
});
