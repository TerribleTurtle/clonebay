import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsRepository } from '../SettingsRepository';
import { logger } from '../../utils/logger';

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  }
}));

describe('SettingsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('gets mock mode when not set', () => {
    expect(SettingsRepository.getMockMode()).toBe(false);
  });

  it('gets mock mode when set to true', () => {
    localStorage.setItem('eve_mock_mode', 'true');
    expect(SettingsRepository.getMockMode()).toBe(true);
  });

  it('sets mock mode', () => {
    SettingsRepository.setMockMode(true);
    expect(localStorage.getItem('eve_mock_mode')).toBe('true');
  });

  it('handles localStorage errors gracefully in getMockMode', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Denied');
    });
    expect(SettingsRepository.getMockMode()).toBe(false);
    expect(logger.error).toHaveBeenCalled();
    spy.mockRestore();
  });
});
