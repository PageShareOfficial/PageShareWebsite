import { GiphyFetch } from '@giphy/js-fetch-api';

let cachedClient: GiphyFetch | null | undefined;

/** Singleton Giphy client; null when `NEXT_PUBLIC_GIPHY_API_KEY` is missing. */
export function getGiphyClient(): GiphyFetch | null {
  if (cachedClient !== undefined) return cachedClient;

  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim() ?? '';
  cachedClient = apiKey ? new GiphyFetch(apiKey) : null;
  return cachedClient;
}
