import { apiGet, apiPost, apiDelete } from '@/lib/api/client';

export interface BackendWatchlistItem {
  ticker: string;
  name?: string | null;
  type?: string | null;
  created_at: string;
}

interface ListWatchlistResponse {
  data: BackendWatchlistItem[];
}

interface AddWatchlistRequestBody {
  symbol: string;
}

interface AddWatchlistResponseBody {
  data: {
    ticker: string;
    added: boolean;
  };
}

export async function listWatchlist(accessToken: string): Promise<BackendWatchlistItem[]> {
  const res = await apiGet<ListWatchlistResponse>('/watchlist', accessToken);
  return res.data;
}

export async function addToWatchlist(
  symbol: string,
  accessToken: string
): Promise<string> {
  const res = await apiPost<AddWatchlistResponseBody>(
    '/watchlist',
    { symbol },
    accessToken
  );
  return res.data.ticker;
}

export async function removeFromWatchlist(
  symbol: string,
  accessToken: string
): Promise<void> {
  await apiDelete(`/watchlist/${encodeURIComponent(symbol)}`, accessToken);
}
