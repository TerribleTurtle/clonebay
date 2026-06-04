import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPi } from '../../src/workers/processors/piProcessor';
import { EsiPlanetSchema, EsiPlanetLayoutSchema, type EsiPlanetLayout } from '../../src/schemas/esi';
import mockPlanetsRaw from '../fixtures/mockPlanets.json';
import { PI_SDE_DATA } from '../../src/utils/piSdeData';

describe('piProcessor', () => {
  let mockPostMessage: any;
  let mockEsiService: any;

  beforeEach(() => {
    mockPostMessage = vi.fn();
    vi.useFakeTimers();

    mockEsiService = {
      getPlanetLayout: vi.fn()
    };
    
    // Inject mock volume data to simulate items filling storage
    PI_SDE_DATA[9999] = { group_id: 0, volume: 100 };
  });

  it('should post Green status when extractors are active > 12 hours and storage is nominal', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanet = EsiPlanetSchema.parse(mockPlanetsRaw[0]);
    const mockPlanets = [mockPlanet];

    const mockLayout: EsiPlanetLayout = {
      pins: [
        {
          pin_id: 1,
          type_id: 1063, // Extractor
          expiry_time: new Date(now + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        {
          pin_id: 2,
          type_id: 1048, // Spaceport (10,000 capacity)
          contents: [
            { type_id: 9999, amount: 10 } // 10 * 100 = 1000 used (10%)
          ]
        }
      ]
    };
    const validLayout = EsiPlanetLayoutSchema.parse(mockLayout);

    mockEsiService.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'pi', status: 'Green', data: mockPlanets }
    });
  });

  it('should post Yellow status when extractor cycle ends < 12 hours', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const mockLayout: EsiPlanetLayout = {
      pins: [
        {
          pin_id: 1,
          type_id: 1063, // Extractor
          expiry_time: new Date(now + 10 * 60 * 60 * 1000).toISOString(), // 10 hours
        }
      ]
    };
    const validLayout = EsiPlanetLayoutSchema.parse(mockLayout);
    mockEsiService.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'pi', status: 'Yellow', data: mockPlanets }
    });
  });

  it('should post Red status when an extractor is stopped (Exact Zero Boundary)', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const mockLayout: EsiPlanetLayout = {
      pins: [
        {
          pin_id: 1,
          type_id: 1063, // Extractor
          expiry_time: new Date(now).toISOString(), // Exact Zero Boundary
        }
      ]
    };
    const validLayout = EsiPlanetLayoutSchema.parse(mockLayout);
    mockEsiService.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'pi', status: 'Red', data: mockPlanets }
    });
  });

  it('should post Red status when storage is 100% full', async () => {
    const now = new Date('2026-06-03T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const mockPlanets = [EsiPlanetSchema.parse(mockPlanetsRaw[0])];

    const mockLayout: EsiPlanetLayout = {
      pins: [
        {
          pin_id: 2,
          type_id: 1048, // Spaceport (10,000 capacity)
          contents: [
            { type_id: 9999, amount: 100 } // 100 * 100 = 10000 used (100%)
          ]
        }
      ]
    };
    const validLayout = EsiPlanetLayoutSchema.parse(mockLayout);
    mockEsiService.getPlanetLayout.mockResolvedValue({ status: 'Green', cached: false, data: validLayout });

    await processPi('char-1', { status: 'Green', cached: false, data: mockPlanets }, mockEsiService, 'token', mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'pi', status: 'Red', data: mockPlanets }
    });
  });

  it('should post Offline status when ESI is offline', async () => {
    await processPi('char-1', { status: 'Offline', cached: false, data: null }, mockEsiService, 'token', mockPostMessage);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'ESI_DATA_UPDATE',
      payload: { characterId: 'char-1', dataType: 'pi', status: 'Offline', data: null }
    });
  });
});
