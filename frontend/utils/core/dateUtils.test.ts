import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './dateUtils';

describe('formatDate', () => {
  it('returns formatted date for valid ISO string', () => {
    expect(formatDate('2024-01-15T12:00:00.000Z')).toMatch(
      /Jan 15, 2024|Jan \d+, 2024/
    );
  });

  it('returns N/A for null or undefined', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('returns N/A for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('N/A');
    expect(formatDate('')).toBe('N/A');
  });

  it('returns N/A for invalid date (NaN getTime)', () => {
    expect(formatDate('2024-13-45')).toBe('N/A');
  });
});

describe('formatDateTime', () => {
  it('returns formatted date and time for valid ISO string', () => {
    const result = formatDateTime('2024-01-15T15:45:00.000Z');
    expect(result).toContain('Jan 15, 2024');
    expect(result).toContain('at');
    expect(result.length).toBeGreaterThan(10);
  });

  it('returns empty string for null or undefined', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDateTime('not-a-date')).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('returns empty string for invalid date (NaN getTime)', () => {
    expect(formatDateTime('2024-99-99')).toBe('');
  });

  it('formats time with 12-hour and AM/PM', () => {
    const morning = formatDateTime('2024-06-01T09:30:00.000Z');
    const afternoon = formatDateTime('2024-06-01T14:30:00.000Z');
    expect(morning).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
    expect(afternoon).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
  });
});
