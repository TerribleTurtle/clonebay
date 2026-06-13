import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processNotifications } from '../../src/workers/processors/notificationProcessor';
import type { EsiNotification, EsiWar } from '../../src/schemas/esi';

describe('notificationProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEsiService: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T10:00:00Z'));
    mockPostMessage = vi.fn();
    mockEsiService = {
      getWar: vi.fn(),
      resolveNames: vi.fn().mockResolvedValue({ data: [] })
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });


  it('should post Green status when there are no wars', async () => {
    const notifications: EsiNotification[] = [];
    await processNotifications('char-1', notifications, mockEsiService, mockPostMessage);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({
        characterId: 'char-1',
        dataType: 'war',
        status: 'Green',
        data: expect.objectContaining({ warStatus: 'Green' })
      })
    });
  });

  it('should post Red status when there is an active war', async () => {
    const now = Date.now();
    const notifications: EsiNotification[] = [
      {
        notification_id: 1,
        type: 'WarDeclared',
        sender_id: 123,
        sender_type: 'corporation',
        timestamp: new Date(now - 1000).toISOString(),
        text: 'warID: 42\n'
      }
    ];

    const mockWar: EsiWar = {
      id: 42,
      declared: new Date(now - 86400000).toISOString(),
      started: new Date(now - 3600000).toISOString(), // started 1 hour ago
      aggressor: { corporation_id: 999, isk_destroyed: 0, ships_killed: 0 },
      defender: { corporation_id: 888, isk_destroyed: 0, ships_killed: 0 },
      mutual: false,
      open_for_allies: false
    };

    mockEsiService.getWar.mockResolvedValue({ data: mockWar });

    await processNotifications('char-1', notifications, mockEsiService, mockPostMessage);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({
        characterId: 'char-1',
        dataType: 'war',
        status: 'Red'
      })
    });
  });

  it('should post Yellow status when there is a pending war', async () => {
    const now = Date.now();
    const notifications: EsiNotification[] = [
      {
        notification_id: 2,
        type: 'WarDeclared',
        sender_id: 123,
        sender_type: 'corporation',
        timestamp: new Date(now - 1000).toISOString(),
        text: 'warID: 43\n'
      }
    ];

    const mockWar: EsiWar = {
      id: 43,
      declared: new Date(now - 1000).toISOString(),
      started: new Date(now + 86400000).toISOString(), // starts tomorrow
      aggressor: { corporation_id: 999, isk_destroyed: 0, ships_killed: 0 },
      defender: { corporation_id: 888, isk_destroyed: 0, ships_killed: 0 },
      mutual: false,
      open_for_allies: false
    };

    mockEsiService.getWar.mockResolvedValue({ data: mockWar });

    await processNotifications('char-1', notifications, mockEsiService, mockPostMessage);
    
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({
        characterId: 'char-1',
        dataType: 'war',
        status: 'Yellow'
      })
    });
  });

  it('should cleanly intercept errors during war fetch and still process', async () => {
    const now = Date.now();
    const notifications: EsiNotification[] = [
      {
        notification_id: 3,
        type: 'WarDeclared',
        sender_id: 123,
        sender_type: 'corporation',
        timestamp: new Date(now - 1000).toISOString(),
        text: 'warID: 44\n'
      }
    ];

    mockEsiService.getWar.mockRejectedValue(new Error('Network error'));

    // Should not throw, should handle gracefully and post Offline since war couldn't be confirmed active
    await processNotifications('char-1', notifications, mockEsiService, mockPostMessage);
    
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESI_DATA_UPDATE',
        payload: expect.objectContaining({
          status: 'Offline',
          data: expect.objectContaining({
            warStatus: 'Offline',
            warContext: { alerts: ['Failed to fetch details for war ID 44'] }
          })
        })
      })
    );
  });
});
