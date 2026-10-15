import CryptoEventsBrowser from '@/components/app/events/CryptoEventsBrowser';
import { ROUTES } from '@/constants/routes';
import { fetchCryptoEventsForPage } from '@/lib/api/cryptoEventsServer';
import { siteConfig } from '@/lib/seo/metadata';
import { filterCryptoEvents } from '@/utils/events/cryptoEventFilters';
import { buildCryptoEventsJsonLd, serializeJsonLd } from '@/utils/events/cryptoEventsJsonLd';

export default async function EventsPage() {
  const feed = await fetchCryptoEventsForPage();
  const listedEvents = feed ? filterCryptoEvents(feed.events, 'all') : [];
  const jsonLd = buildCryptoEventsJsonLd(listedEvents, `${siteConfig.url}${ROUTES.events}`);

  return (
    <>
      {listedEvents.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <header className="flex flex-col gap-1 px-4 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Crypto Events &amp; Conferences</h1>
        <p className="text-sm text-gray-400">
          Upcoming crypto conferences, summits, hackathons and meetups around the world, updated
          throughout the day. Filter for events happening now or free to attend.
        </p>
      </header>

      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          <CryptoEventsBrowser initialFeed={feed} />
        </div>
      </div>
    </>
  );
}
