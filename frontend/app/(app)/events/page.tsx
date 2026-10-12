'use client';

import { useMemo, useState } from 'react';
import Loading from '@/components/app/common/Loading';
import CryptoEventFilterTabs from '@/components/app/events/CryptoEventFilterTabs';
import CryptoEventsList from '@/components/app/events/CryptoEventsList';
import { useCryptoEvents } from '@/hooks/features/useCryptoEvents';
import type { CryptoEventsSource } from '@/types/cryptoEvents';
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

export default function EventsPage() {
  const { feed, isLoading, error, retry } = useCryptoEvents();
  const [activeFilter, setActiveFilter] = useState<CryptoEventFilter>('all');
  const visibleEvents = useMemo(
    () => (feed ? filterCryptoEvents(feed.events, activeFilter) : []),
    [feed, activeFilter]
  );

  return (
    <>
      <div className="hidden md:flex flex-col px-4 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Crypto Events</h1>
        <p className="text-sm text-gray-400">Conferences, summits and meetups across the crypto space</p>
      </div>

      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4 space-y-5">
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
      </div>
    </>
  );
}
