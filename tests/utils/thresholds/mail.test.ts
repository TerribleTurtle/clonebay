import { describe, it, expect } from 'vitest';
import { calculateMailStatus } from '../../../src/utils/thresholds/mail';
import mailLabelsFixture from '../../fixtures/character_mail_labels.json';

describe('calculateMailStatus', () => {
  it('should return Green if unreadCount is undefined or null', () => {
    expect(calculateMailStatus(undefined)).toBe('Green');
    expect(calculateMailStatus(null)).toBe('Green');
  });

  it('Exact Zero Boundary: should return Green if unreadCount === 0', () => {
    expect(calculateMailStatus(0)).toBe('Green');
  });

  it('should return Yellow if unreadCount > 0', () => {
    expect(calculateMailStatus(1)).toBe('Yellow');
  });

  it('should handle fully hydrated mock structure from fixture', () => {
    // Clone fixture and override unread count
    const mailData = { ...mailLabelsFixture };
    expect(calculateMailStatus(mailData.total_unread_count)).toBe('Yellow'); // 5 from fixture
    
    // Boundary test with fixture
    const emptyMailData = { ...mailLabelsFixture, total_unread_count: 0 };
    expect(calculateMailStatus(emptyMailData.total_unread_count)).toBe('Green');
  });
});
