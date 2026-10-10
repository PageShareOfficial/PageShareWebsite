import { describe, expect, it } from 'vitest';
import { formatCryptoPrice } from './tickerUtils';

describe('formatCryptoPrice', () => {
  it('uses 2 decimals at or above $1', () => {
    expect(formatCryptoPrice(83010)).toBe('$83,010.00');
    expect(formatCryptoPrice(1.4)).toBe('$1.40');
  });

  it('keeps 4 significant digits below $1', () => {
    expect(formatCryptoPrice(0.086008)).toBe('$0.08601');
    expect(formatCryptoPrice(0.00000547)).toBe('$0.00000547');
  });

  it('returns N/A for non-finite input', () => {
    expect(formatCryptoPrice(Number.NaN)).toBe('N/A');
  });
});
