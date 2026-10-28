import { describe, expect, it } from 'vitest';
import {
  COINCAP_ICON_BASE, COINGECKO_ICON_BASE, getCryptoLogoUrl, getTickerIconUrl,
} from './logoUtils';

describe('getTickerIconUrl', () => {
  it('builds a CoinCap icon URL from the symbol', () => {
    expect(getTickerIconUrl('BTC')).toBe(
      `${COINCAP_ICON_BASE}/btc@2x.png`
    );
    expect(getTickerIconUrl(' eth ')).toBe(
      `${COINCAP_ICON_BASE}/eth@2x.png`
    );
  });

  it('returns an empty string when the symbol is blank', () => {
    expect(getTickerIconUrl('')).toBe('');
    expect(getTickerIconUrl('   ')).toBe('');
  });
});

describe('getCryptoLogoUrl', () => {
  it('builds a CoinGecko image URL from the coin id', () => {
    expect(getCryptoLogoUrl('bitcoin')).toBe(
      `${COINGECKO_ICON_BASE}/bitcoin/small.png`
    );
    expect(getCryptoLogoUrl('ethereum', 'large')).toBe(
      `${COINGECKO_ICON_BASE}/ethereum/large.png`
    );
  });

  it('returns an empty string when the coin id is blank', () => {
    expect(getCryptoLogoUrl('')).toBe('');
    expect(getCryptoLogoUrl('   ')).toBe('');
  });
});
