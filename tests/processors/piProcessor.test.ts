import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processPi } from '../../src/workers/processors/piProcessor';
import { EsiPlanetSchema, EsiPlanetLayoutSchema, type EsiPlanetLayout } from '../../src/schemas/esi';
import mockPlanetsRaw from '../fixtures/mockPlanets.json';
import piLayoutRaw from '../fixtures/pi_layout.json';
import { PI_SDE_DATA } from '../../src/utils/piSdeData';

describe('piProcessor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPostMessage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEsiService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockNameCache: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    vi.useFakeTimers();

    mockEsiService = {
      industry: { getPlanetLayout: vi.fn() }
    };
    mockNameCache = { resolveIdsToNames: vi.fn().mockResolvedValue({}) };
    
    // Inject mock volume data to simulate items filling storage
    PI_SDE_DATA[9999] = { group_id: 0, volume: 100 };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('should post Green status when extractors are active > 12 hours and storage is nominal', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanet = EsiPlanetSchema.parse(mockPlanetsRaw[0]);
    const mockPlanets = [mockPlanet];

    const baseLayout = EsiPlanetLayoutSchema.parse(piLayoutRaw);
    const validLayout: EsiPlanetLayout = {
      ...baseLayout,
      pins: [
        {
          ...baseLayout.pins![0],
          expiry_time: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        {
          ...baseLayout.pins![1],
          contents: [
            { type_id: 9999, amount: 10 } // 10 * 100 = 1000 used (10%)
          ]
        }
      ] as EsiPlanetLayout['pins']
    };

    mockEsiService.industry.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Green', data: mockPlanets })
    });
  });

  it('should post Yellow status when extraction program ends < 12 hours', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const baseLayout = EsiPlanetLayoutSchema.parse(piLayoutRaw);
    const validLayout: EsiPlanetLayout = {
      ...baseLayout,
      pins: [
        {
          ...baseLayout.pins![0],
          expiry_time: new Date(now + 10 * 60 * 60 * 1000).toISOString(), // 10 hours
        },
        baseLayout.pins![1]
      ] as EsiPlanetLayout['pins']
    };
    mockEsiService.industry.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Yellow', data: mockPlanets })
    });
  });

  it('should post Red status when an extractor is stopped (Exact Zero Boundary)', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const baseLayout = EsiPlanetLayoutSchema.parse(piLayoutRaw);
    const validLayout: EsiPlanetLayout = {
      ...baseLayout,
      pins: [
        {
          ...baseLayout.pins![0],
          expiry_time: new Date(now).toISOString(), // Exact Zero Boundary
        },
        baseLayout.pins![1]
      ] as EsiPlanetLayout['pins']
    };
    mockEsiService.industry.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Red', data: mockPlanets })
    });
  });

  it('should post Red status when storage is 100% full', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const baseLayout = EsiPlanetLayoutSchema.parse(piLayoutRaw);
    const validLayout: EsiPlanetLayout = {
      ...baseLayout,
      pins: [
        baseLayout.pins![0],
        {
          ...baseLayout.pins![1],
          contents: [
            { type_id: 9999, amount: 100 } // 100 * 100 = 10000 used (100%)
          ]
        }
      ] as EsiPlanetLayout['pins']
    };
    mockEsiService.industry.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Red', data: mockPlanets })
    });
  });

  it('should post Offline status when ESI is offline', async () => {
    await processPi('char-1', { status: 'Offline', cached: false, data: null }, mockEsiService, 'token', mockNameCache, mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Offline', data: null })
    });
  });

  it('should post Red status when an error is thrown', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];
    
    // Explicitly reject to hit the catch block
    mockEsiService.industry.getPlanetLayout.mockRejectedValue(new Error('Test error'));

    await expect(processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockNameCache, mockPostMessage)).rejects.toThrow();

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: expect.objectContaining({ characterId: 'char-1', dataType: 'pi', status: 'Red', data: null })
    });
  });
});


