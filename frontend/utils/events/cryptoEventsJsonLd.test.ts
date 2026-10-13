import { describe, expect, it } from 'vitest';
import type { CryptoEvent } from '@/types/cryptoEvents';
import { buildCryptoEventsJsonLd, serializeJsonLd } from '@/utils/events/cryptoEventsJsonLd';

const PAGE_URL = 'https://www.pageshare.io/events';

function cryptoEvent(overrides: Partial<CryptoEvent> = {}): CryptoEvent {
  return {
    id: 'event-1',
    name: 'Bitcoin Summit',
    url: 'https://events.coinpedia.org/bitcoin-summit-1/',
    imageUrl: 'https://image.coinpedia.org/app_uploads/events/a.webp',
    location: 'Dubai, UAE',
    startDate: '2026-11-01',
    utcOffset: '+04:00',
    status: 'upcoming',
    ticketType: 'paid',
    eventType: 'Summit',
    ...overrides,
  };
}

describe('buildCryptoEventsJsonLd', () => {
  it('lists events in order as schema.org Events', () => {
    const jsonLd = buildCryptoEventsJsonLd(
      [cryptoEvent(), cryptoEvent({ id: 'event-2', name: 'ETH Meetup' })],
      PAGE_URL
    );

    expect(jsonLd).toMatchObject({ '@type': 'ItemList', url: PAGE_URL });
    const items = jsonLd.itemListElement as { position: number; item: Record<string, unknown> }[];
    expect(items.map((entry) => entry.position)).toEqual([1, 2]);
    expect(items[0].item).toMatchObject({
      '@type': 'Event',
      name: 'Bitcoin Summit',
      startDate: '2026-11-01T00:00:00+04:00',
      url: 'https://events.coinpedia.org/bitcoin-summit-1/',
      image: ['https://image.coinpedia.org/app_uploads/events/a.webp'],
      location: { '@type': 'Place', name: 'Dubai, UAE', address: 'Dubai, UAE' },
    });
  });

  it('omits optional fields the source did not provide', () => {
    const jsonLd = buildCryptoEventsJsonLd(
      [cryptoEvent({ imageUrl: null, location: null, utcOffset: null })],
      PAGE_URL
    );
    const [{ item }] = jsonLd.itemListElement as { item: Record<string, unknown> }[];

    expect(item.startDate).toBe('2026-11-01');
    expect(item).not.toHaveProperty('image');
    expect(item).not.toHaveProperty('location');
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so scraped text cannot break out of the script tag', () => {
    const jsonLd = buildCryptoEventsJsonLd([cryptoEvent({ name: '</script><b>x' })], PAGE_URL);
    const serialized = serializeJsonLd(jsonLd);

    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized).itemListElement[0].item.name).toBe('</script><b>x');
  });
});
