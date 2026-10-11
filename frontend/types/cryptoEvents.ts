export type CryptoEventStatus = 'ongoing' | 'upcoming' | 'ended';

export type CryptoEventTicketType = 'free' | 'paid' | 'stay_tuned';

export interface CryptoEvent {
  id: string;
  name: string;
  url: string;
  imageUrl: string | null;
  location: string | null;
  /** Calendar date (YYYY-MM-DD) in the event's local timezone. */
  startDate: string;
  utcOffset: string | null;
  status: CryptoEventStatus;
  ticketType: CryptoEventTicketType | null;
  eventType: string | null;
}

export interface CryptoEventsSource {
  name: string;
  url: string;
}

export interface CryptoEventsFeed {
  events: CryptoEvent[];
  source: CryptoEventsSource;
  fetchedAt: string;
}

/** Wire format returned by GET /api/v1/events. */
export interface CryptoEventApiItem {
  id: string;
  name: string;
  url: string;
  image_url: string | null;
  location: string | null;
  start_date: string;
  utc_offset: string | null;
  status: CryptoEventStatus;
  ticket_type: CryptoEventTicketType | null;
  event_type: string | null;
}

export interface CryptoEventsApiResponse {
  data: CryptoEventApiItem[];
  source: CryptoEventsSource;
  fetched_at: string;
  is_stale: boolean;
}
