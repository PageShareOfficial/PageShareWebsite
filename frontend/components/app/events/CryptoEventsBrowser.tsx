'use client';

import { useMemo, useState } from 'react';
import Loading from '@/components/app/common/Loading';
import CryptoEventFilterTabs from '@/components/app/events/CryptoEventFilterTabs';
import CryptoEventsList from '@/components/app/events/CryptoEventsList';
import { useCryptoEvents } from '@/hooks/features/useCryptoEvents';
import type { CryptoEventsFeed, CryptoEventsSource } from '@/types/cryptoEvents';
import { filterCryptoEvents, type CryptoEventFilter } from '@/utils/events/cryptoEventFilters';

function SourceAttribution({ source }: { source: CryptoEventsSource }) {
  return (
    <p className="mt-8 text-center text-xs text-gray-500">
      Events listed by{' '}
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-gray-300"
      >
        {source.name}
      </a>
    </p>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-red-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200"
      >
        Try again
      </button>
    </div>
  );
}

/** Interactive part of /events: filters and the event grid, seeded with the server-rendered feed. */
export default function CryptoEventsBrowser({ initialFeed }: { initialFeed: CryptoEventsFeed | null }) {
  const { feed, isLoading, error, retry } = useCryptoEvents(initialFeed);
  const [activeFilter, setActiveFilter] = useState<CryptoEventFilter>('all');
  const visibleEvents = useMemo(
    () => (feed ? filterCryptoEvents(feed.events, activeFilter) : []),
    [feed, activeFilter]
  );

  return (
    <div className="space-y-5">
      <CryptoEventFilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />
      {feed ? (
        <>
          <CryptoEventsList events={visibleEvents} />
          <SourceAttribution source={feed.source} />
        </>
      ) : isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loading />
        </div>
      ) : (
        <LoadError message={error ?? 'Could not load crypto events'} onRetry={retry} />
      )}
    </div>
  );
}
