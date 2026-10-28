import { describe, expect, it } from 'vitest';
import { formatPercent } from './predictionFormFormat';

describe('formatPercent', () => {
  it('prefixes positive values with +', () => {
    expect(formatPercent(1.5)).toBe('+1.50%');
  });

  it('keeps the minus sign for negative values', () => {
    expect(formatPercent(-0.5)).toBe('-0.50%');
  });

  it('formats zero without a plus sign', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});
