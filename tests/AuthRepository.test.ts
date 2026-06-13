import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addOrUpdateCharacter, getAuthDictionary, setAuthDictionary, removeCharacter } from '../src/auth/AuthRepository';
import { clear } from 'idb-keyval';

describe('AuthRepository', () => {
  beforeEach(async () => {
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
});


