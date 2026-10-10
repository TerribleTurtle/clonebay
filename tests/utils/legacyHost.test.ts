import { describe, it, expect } from 'vitest';
import { isLegacyHost } from '../../src/utils/legacyHost';
import { LEGACY_HOSTNAME, SITE_URL } from '../../src/config/constants';

describe('isLegacyHost', () => {
  it('returns true for exact match on LEGACY_HOSTNAME', () => {
    expect(isLegacyHost(LEGACY_HOSTNAME)).toBe(true);
    expect(isLegacyHost('clonebay.app')).toBe(true);
  });

  it('returns true for www variant of LEGACY_HOSTNAME', () => {
    expect(isLegacyHost(`www.${LEGACY_HOSTNAME}`)).toBe(true);
    expect(isLegacyHost('www.clonebay.app')).toBe(true);
  });

  it('handles case-insensitive matches', () => {
    expect(isLegacyHost('CLONEBAY.APP')).toBe(true);
    expect(isLegacyHost('Www.CloneBay.App')).toBe(true);
  });

  it('returns false for the new domain', () => {
    const newHostname = new URL(SITE_URL).hostname;
    expect(isLegacyHost(newHostname)).toBe(false);
    expect(isLegacyHost('clonebay.terribleturtles.dev')).toBe(false);
    expect(isLegacyHost('www.clonebay.terribleturtles.dev')).toBe(false);
  });

  it('returns false for localhost', () => {
    expect(isLegacyHost('localhost')).toBe(false);
    expect(isLegacyHost('127.0.0.1')).toBe(false);
  });

  it('returns false for lookalike domains', () => {
    expect(isLegacyHost('notclonebay.app')).toBe(false);
    expect(isLegacyHost('clonebay.app.evil.com')).toBe(false);
    expect(isLegacyHost('clonebay.apps')).toBe(false);
    expect(isLegacyHost('fakeclonebay.app')).toBe(false);
    expect(isLegacyHost('sub.clonebay.app')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLegacyHost('')).toBe(false);
  });
});
