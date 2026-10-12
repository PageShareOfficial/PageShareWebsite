import { apiGet } from '@/lib/api/client';
import type { CryptoEventsApiResponse, CryptoEventsFeed } from '@/types/cryptoEvents';
import { mapCryptoEventsResponse } from '@/utils/events/cryptoEventMappers';

/** Fetch upcoming and ongoing crypto events (public endpoint, no auth). */
export async function fetchCryptoEvents(): Promise<CryptoEventsFeed> {
  const response = await apiGet<CryptoEventsApiResponse>('/events');
  return mapCryptoEventsResponse(response);
}
