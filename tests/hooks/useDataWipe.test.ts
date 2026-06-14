import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDataWipe } from '../../src/hooks/useDataWipe';
import * as AuthRepository from '../../src/auth/AuthRepository';
import { BrowserStorageService } from '../../src/services/BrowserStorageService';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

vi.mock('../../src/auth/AuthRepository', () => ({
  clearAuthDictionary: vi.fn()
}));

vi.mock('../../src/services/BrowserStorageService', () => ({
  BrowserStorageService: {
    clearAllStorage: vi.fn()
  }
}));

describe('useDataWipe', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('wipes all data and redirects on confirm', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useDataWipe());
    
    await act(async () => {
      await result.current.handleWipeData('Are you sure?');
    });

    expect(window.confirm).toHaveBeenCalledWith('Are you sure?');
    expect(AuthRepository.clearAuthDictionary).toHaveBeenCalledTimes(1);
    expect(BrowserStorageService.clearAllStorage).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/');

    window.confirm = originalConfirm;
  });
});
