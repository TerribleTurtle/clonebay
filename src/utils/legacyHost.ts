import { LEGACY_HOSTNAME } from '../config/constants';

/**
 * Pure helper to verify if a given hostname matches the legacy domain
 * or its www variant.
 */
export function isLegacyHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === LEGACY_HOSTNAME || normalized === `www.${LEGACY_HOSTNAME}`;
}

/**
 * Safely accesses window.location.hostname in the browser.
 * UI components must delegate window.location access here per architectural boundaries.
 */
export function getWindowHostname(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.hostname;
}
