/** Raw cashtag must start with `$` and include a non-empty symbol. */
export function parseCashtagSymbol(tag: string): string | null {
  if (typeof tag !== 'string' || !tag.startsWith('$')) return null;
  const symbol = tag.slice(1).trim().toUpperCase();
  return symbol.length > 0 ? symbol : null;
}

/** Display label for a ticker symbol, e.g. `BTC` → `$BTC`. */
export function formatCashtagLabel(symbol: string): string {
  return `$${symbol.trim().toUpperCase()}`;
}
