import type { CryptoEvent } from '@/types/cryptoEvents';

export type CryptoEventFilter = 'all' | 'ongoing' | 'upcoming' | 'free';

export const CRYPTO_EVENT_FILTERS: { id: CryptoEventFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'Happening now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'free', label: 'Free' },
];

function matchesFilter(event: CryptoEvent, filter: CryptoEventFilter): boolean {
  switch (filter) {
    case 'ongoing':
    case 'upcoming':
      return event.status === filter;
    case 'free':
      return event.ticketType === 'free';
    default:
      return true;
  }
}

/** Visible events for a filter: ended events are dropped, the rest sorted by start date. */
export function filterCryptoEvents(
  events: CryptoEvent[],
  filter: CryptoEventFilter
): CryptoEvent[] {
  return events
    .filter((event) => event.status !== 'ended' && matchesFilter(event, filter))
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
}
