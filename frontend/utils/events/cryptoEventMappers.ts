import type {
  CryptoEvent,
  CryptoEventApiItem,
  CryptoEventsApiResponse,
  CryptoEventsFeed,
} from '@/types/cryptoEvents';

export function mapCryptoEvent(item: CryptoEventApiItem): CryptoEvent {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    imageUrl: item.image_url,
    location: item.location,
    startDate: item.start_date,
    utcOffset: item.utc_offset,
    status: item.status,
    ticketType: item.ticket_type,
    eventType: item.event_type,
  };
}

export function mapCryptoEventsResponse(response: CryptoEventsApiResponse): CryptoEventsFeed {
  if (!response || !Array.isArray(response.data)) {
    throw new Error('Unexpected crypto events response');
  }
  return {
    events: response.data.map(mapCryptoEvent),
    source: response.source,
    fetchedAt: response.fetched_at,
  };
}
