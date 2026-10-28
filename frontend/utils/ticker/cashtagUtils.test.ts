import { describe, expect, it } from 'vitest';
import { formatCashtagLabel, parseCashtagSymbol } from './cashtagUtils';

describe('parseCashtagSymbol', () => {
  it('returns an uppercase symbol from a cashtag', () => {
    expect(parseCashtagSymbol('$btc')).toBe('BTC');
    expect(parseCashtagSymbol('$ETH')).toBe('ETH');
  });

  it('rejects missing or empty cashtags', () => {
    expect(parseCashtagSymbol('')).toBeNull();
    expect(parseCashtagSymbol('BTC')).toBeNull();
    expect(parseCashtagSymbol('$')).toBeNull();
    expect(parseCashtagSymbol('$   ')).toBeNull();
  });
});

describe('formatCashtagLabel', () => {
  it('prefixes the uppercase symbol with $', () => {
    expect(formatCashtagLabel('btc')).toBe('$BTC');
    expect(formatCashtagLabel(' ETH ')).toBe('$ETH');
  });
});
