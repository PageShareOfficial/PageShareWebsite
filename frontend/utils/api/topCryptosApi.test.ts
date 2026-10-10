import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTopCryptos, selectTopCryptos, toTopCrypto } from './topCryptosApi';

const BITCOIN_ROW = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png',
  current_price: 65000,
  price_change_percentage_24h: -1.25,
};

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe('toTopCrypto', () => {
  it('maps a CoinGecko market row', () => {
    expect(toTopCrypto(BITCOIN_ROW)).toEqual({
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      imageUrl: BITCOIN_ROW.image,
      priceUsd: 65000,
      change24hPercent: -1.25,
    });
  });

  it('defaults a missing 24h change to 0', () => {
    const row = { ...BITCOIN_ROW, price_change_percentage_24h: null };
    expect(toTopCrypto(row)?.change24hPercent).toBe(0);
  });

  it('rejects rows missing required fields', () => {
    expect(toTopCrypto({ ...BITCOIN_ROW, image: undefined })).toBeNull();
    expect(toTopCrypto({ ...BITCOIN_ROW, current_price: null })).toBeNull();
    expect(toTopCrypto({ ...BITCOIN_ROW, name: 42 })).toBeNull();
  });

  it('rejects non-object rows', () => {
    expect(toTopCrypto(null)).toBeNull();
    expect(toTopCrypto('bitcoin')).toBeNull();
  });
});

describe('selectTopCryptos', () => {
  const coinRow = (id: string) => ({ ...BITCOIN_ROW, id });

  it('drops stablecoins and pegged assets but keeps market-cap order', () => {
    const rows = [coinRow('bitcoin'), coinRow('tether'), coinRow('ethereum'), coinRow('usd-coin')];
    expect(selectTopCryptos(rows, 10).map((coin) => coin.id)).toEqual(['bitcoin', 'ethereum']);
  });

  it('caps the result at the limit', () => {
    const rows = ['a', 'b', 'c'].map(coinRow);
    expect(selectTopCryptos(rows, 2)).toHaveLength(2);
  });
});

describe('fetchTopCryptos', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests coins by market cap and drops invalid rows', async () => {
    const fetchSpy = mockFetchResponse([BITCOIN_ROW, { id: 'broken' }]);
    const cryptos = await fetchTopCryptos(10);
    expect(cryptos).toHaveLength(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain('order=market_cap_desc');
  });

  it('returns [] and logs when CoinGecko errors', async () => {
    mockFetchResponse({}, false, 429);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await fetchTopCryptos()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns [] and logs when the response is not a list', async () => {
    mockFetchResponse({ error: 'rate limited' });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await fetchTopCryptos()).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns [] when the request throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await fetchTopCryptos()).toEqual([]);
  });
});
