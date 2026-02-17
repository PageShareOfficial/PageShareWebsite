'use client';

export type TickerKind = 'crypto';

export const KNOWN_CRYPTO_TICKERS: readonly string[] = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX',
  'LTC', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'ALGO', 'VET', 'ICP',
];

export function normalizeTickerSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isKnownCryptoTicker(symbol: string): boolean {
  return KNOWN_CRYPTO_TICKERS.includes(normalizeTickerSymbol(symbol));
}

export function resolveTickerType(symbol: string, _suggestedType?: TickerKind): TickerKind {
  return 'crypto';
}
