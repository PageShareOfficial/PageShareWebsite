import type { CryptoEvent } from '@/types/cryptoEvents';
import CryptoEventCard from './CryptoEventCard';

/** First grid row (two columns from `sm`) is above the fold; one of its banners is usually the LCP. */
const ABOVE_FOLD_CARD_COUNT = 2;

export default function CryptoEventsList({ events }: { events: CryptoEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-16 text-center text-gray-400">No events match this filter right now.</p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {events.map((event, index) => (
        <CryptoEventCard
          key={event.id}
          event={event}
          isAboveFold={index < ABOVE_FOLD_CARD_COUNT}
        />
      ))}
    </div>
  );
}
