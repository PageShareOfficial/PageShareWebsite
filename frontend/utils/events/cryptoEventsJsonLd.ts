import type { CryptoEvent } from '@/types/cryptoEvents';

type JsonLdNode = Record<string, unknown>;

function toEventStartDate(event: CryptoEvent): string {
  return event.utcOffset ? `${event.startDate}T00:00:00${event.utcOffset}` : event.startDate;
}

function toEventNode(event: CryptoEvent): JsonLdNode {
  const node: JsonLdNode = {
    '@type': 'Event',
    name: event.name,
    startDate: toEventStartDate(event),
    url: event.url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
  if (event.imageUrl) node.image = [event.imageUrl];
  if (event.location) {
    node.location = { '@type': 'Place', name: event.location, address: event.location };
  }
  return node;
}

/** schema.org ItemList of the events shown on the page (search engines read this, users don't). */
export function buildCryptoEventsJsonLd(events: CryptoEvent[], pageUrl: string): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Crypto events and conferences',
    url: pageUrl,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: toEventNode(event),
    })),
  };
}

/** Escapes `<` so event text can never close the surrounding <script> tag. */
export function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
