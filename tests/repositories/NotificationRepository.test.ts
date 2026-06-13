import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationsDictionary, saveCharacterNotifications, getCharacterNotifications } from '../../src/repositories/NotificationRepository';
import { StorageError } from '../../src/auth/AuthRepository';
import * as idb from 'idb-keyval';
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

describe('NotificationRepository', () => {
  beforeEach(async () => {
    failIdb = false;
    await idb.clear();
    vi.clearAllMocks();
  });

  it('gets dictionary', async () => {
    await idb.set('eve_notifications', { char1: [] });
    const dict = await getNotificationsDictionary();
    expect(dict).toEqual({ char1: [] });
  });

  it('gets empty dictionary if undefined', async () => {
    await idb.del('eve_notifications');
    const dict = await getNotificationsDictionary();
    expect(dict).toEqual({});
  });

  it('saves character notifications', async () => {
    await idb.del('eve_notifications');
    const mockNotes = [{ notification_id: 1, sender_id: 2, sender_type: 'character', text: '', timestamp: '2025-01-01T00:00:00Z', type: 'test' }];
    
    await saveCharacterNotifications('char1', mockNotes as Parameters<typeof saveCharacterNotifications>[1]);
    const dict = await idb.get('eve_notifications');
    expect(dict).toEqual({ char1: mockNotes });
  });

  it('gets character notifications', async () => {
    await idb.set('eve_notifications', { char1: [{ notification_id: 1 }] });
    const notes = await getCharacterNotifications('char1');
    expect(notes).toEqual([{ notification_id: 1 }]);
  });

  it('fails loudly with StorageError on IDB read failure', async () => {
    failIdb = true;
    await expect(getNotificationsDictionary()).rejects.toThrow(StorageError);
  });

  it('fails loudly with StorageError on IDB write failure', async () => {
    failIdb = true;
    await expect(saveCharacterNotifications('char1', [])).rejects.toThrow(StorageError);
  });
});
