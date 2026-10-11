import Image from 'next/image';
import { Calendar, ExternalLink, MapPin, Ticket } from '@/constants/icons';
import type { CryptoEvent, CryptoEventTicketType } from '@/types/cryptoEvents';
import { formatDate } from '@/utils/core/dateUtils';

const TICKET_LABELS: Record<CryptoEventTicketType, string> = {
  free: 'Free',
  paid: 'Paid',
  stay_tuned: 'Tickets TBA',
};

/** Parse as a local calendar date so the day doesn't shift in negative UTC offsets. */
function formatEventDate(startDate: string): string {
  return formatDate(`${startDate}T00:00:00`);
}

interface CryptoEventCardProps {
  event: CryptoEvent;
  isAboveFold?: boolean;
}

function EventBanner({ event, isAboveFold = false }: CryptoEventCardProps) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/5">
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt=""
          fill
          loading={isAboveFold ? 'eager' : 'lazy'}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Calendar className="h-10 w-10 text-gray-600" aria-hidden />
        </div>
      )}
      {event.status === 'ongoing' && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          Live now
        </span>
      )}
    </div>
  );
}

function EventMeta({ event }: { event: CryptoEvent }) {
  return (
    <ul className="space-y-1.5 text-sm text-gray-400">
      <li className="flex items-center gap-2">
        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
        <span>{formatEventDate(event.startDate)}</span>
      </li>
      {event.location && (
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{event.location}</span>
        </li>
      )}
      {event.ticketType && (
        <li className="flex items-center gap-2">
          <Ticket className="h-4 w-4 shrink-0" aria-hidden />
          <span className={event.ticketType === 'free' ? 'text-emerald-400' : undefined}>
            {TICKET_LABELS[event.ticketType]}
          </span>
        </li>
      )}
    </ul>
  );
}

export default function CryptoEventCard({ event, isAboveFold = false }: CryptoEventCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <EventBanner event={event} isAboveFold={isAboveFold} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {event.eventType && (
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {event.eventType}
          </span>
        )}
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white">
          {event.name}
        </h2>
        <EventMeta event={event} />
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${event.name} on Coinpedia (opens in a new tab)`}
          className="mt-auto inline-flex w-fit items-center gap-1 pt-1 text-sm font-medium text-white/80 transition-colors hover:text-white hover:underline underline-offset-2"
        >
          View event
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </article>
  );
}
