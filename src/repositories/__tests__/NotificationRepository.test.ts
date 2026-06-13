import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationsDictionary, saveCharacterNotifications, getCharacterNotifications } from '../NotificationRepository';
import * as idb from 'idb-keyval';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  update: vi.fn()
}));

describe('NotificationRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets dictionary', async () => {
    vi.mocked(idb.get).mockResolvedValue({ char1: [] });
    const dict = await getNotificationsDictionary();
    expect(dict).toEqual({ char1: [] });
    expect(idb.get).toHaveBeenCalledWith('eve_notifications');
  });

  it('gets empty dictionary if undefined', async () => {
    vi.mocked(idb.get).mockResolvedValue(undefined);
    const dict = await getNotificationsDictionary();
    expect(dict).toEqual({});
  });

  it('saves character notifications', async () => {
    const mockNotes = [{ notification_id: 1, sender_id: 2, sender_type: 'character', text: '', timestamp: '2025-01-01T00:00:00Z', type: 'test' }];
    vi.mocked(idb.update).mockImplementation(async (_key, updater) => {
      updater({});
    });
    
    await saveCharacterNotifications('char1', mockNotes as Parameters<typeof saveCharacterNotifications>[1]);
    expect(idb.update).toHaveBeenCalledWith('eve_notifications', expect.any(Function));
  });

  it('gets character notifications', async () => {
    vi.mocked(idb.get).mockResolvedValue({ char1: [{ notification_id: 1 }] });
    const notes = await getCharacterNotifications('char1');
    expect(notes).toEqual([{ notification_id: 1 }]);
  });
});
