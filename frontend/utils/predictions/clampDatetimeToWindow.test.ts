import { describe, expect, it } from 'vitest';
import { clampDatetimeToWindow } from './clampDatetimeToWindow';

describe('clampDatetimeToWindow', () => {
  const min = new Date('2026-01-01T12:00:00');
  const max = new Date('2026-01-03T12:00:00');

  it('returns null for missing or invalid values', () => {
    expect(clampDatetimeToWindow(null, min, max)).toBeNull();
    expect(clampDatetimeToWindow(new Date('invalid'), min, max)).toBeNull();
  });

  it('clamps below the window to min', () => {
    expect(clampDatetimeToWindow(new Date('2025-12-01'), min, max)).toEqual(min);
  });

  it('clamps above the window to max', () => {
    expect(clampDatetimeToWindow(new Date('2026-02-01'), min, max)).toEqual(max);
  });

  it('keeps values inside the window', () => {
    const mid = new Date('2026-01-02T12:00:00');
    expect(clampDatetimeToWindow(mid, min, max)).toEqual(mid);
  });
});
