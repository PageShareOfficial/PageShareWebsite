import { getBaseUrl } from '@/lib/api/client';
import type { CryptoEventsApiResponse, CryptoEventsFeed } from '@/types/cryptoEvents';
import { mapCryptoEventsResponse } from '@/utils/events/cryptoEventMappers';

/**
 * Server-only: Next caches the backend response, so a page render hits the backend at most
 * once per window instead of once per visitor or crawler.
 */
const CRYPTO_EVENTS_REVALIDATE_SECONDS = 30 * 60;

/** Events for server rendering, or null when the backend is unavailable (client then retries). */
export async function fetchCryptoEventsForPage(): Promise<CryptoEventsFeed | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}/api/v1/events`, {
      headers: { accept: 'application/json' },
      next: { revalidate: CRYPTO_EVENTS_REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      console.error(`[cryptoEvents] Backend responded ${response.status}`);
      return null;
    }
    const data = (await response.json()) as CryptoEventsApiResponse;
    return mapCryptoEventsResponse(data);
  } catch (error) {
    console.error('[cryptoEvents] Failed to fetch events for server render', error);
    return null;
  }
}
