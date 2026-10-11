import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CryptoEvent, CryptoEventsApiResponse, CryptoEventsFeed } from '@/types/cryptoEvents';
import { mapCryptoEventsResponse } from '@/utils/events/cryptoEventMappers';
import { filterCryptoEvents } from '@/utils/events/cryptoEventFilters';
import {
  CRYPTO_EVENTS_CACHE_TTL_MS,
  readCachedCryptoEvents,
  writeCachedCryptoEvents,
} from '@/utils/events/cryptoEventsCache';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

function cryptoEvent(overrides: Partial<CryptoEvent> = {}): CryptoEvent {
  return {
    id: 'event-1',
    name: 'Bitcoin Summit',
    url: 'https://events.coinpedia.org/bitcoin-summit-1/',
    imageUrl: null,
    location: 'Dubai, UAE',
    startDate: '2026-11-01',
    utcOffset: '+04:00',
    status: 'upcoming',
    ticketType: 'paid',
    eventType: 'Summit',
    ...overrides,
  };
}

const source = { name: 'Coinpedia', url: 'https://events.coinpedia.org/' };

describe('mapCryptoEventsResponse', () => {
  it('maps snake_case API fields to the camelCase feed', () => {
    const response: CryptoEventsApiResponse = {
      data: [
        {
          id: 'event-1',
          name: 'Bitcoin Summit',
          url: 'https://events.coinpedia.org/bitcoin-summit-1/',
          image_url: 'https://image.coinpedia.org/app_uploads/events/a.webp',
          location: 'Dubai, UAE',
          start_date: '2026-11-01',
          utc_offset: '+04:00',
          status: 'upcoming',
          ticket_type: 'free',
          event_type: 'Summit',
        },
      ],
      source,
      fetched_at: '2026-10-12T00:00:00Z',
      is_stale: false,
    };

    const feed = mapCryptoEventsResponse(response);

    expect(feed.fetchedAt).toBe('2026-10-12T00:00:00Z');
    expect(feed.events[0]).toMatchObject({
      imageUrl: 'https://image.coinpedia.org/app_uploads/events/a.webp',
      startDate: '2026-11-01',
      ticketType: 'free',
      eventType: 'Summit',
    });
  });

  it('rejects a response without a data array', () => {
    const malformed = { source, fetched_at: '' } as unknown as CryptoEventsApiResponse;
    expect(() => mapCryptoEventsResponse(malformed)).toThrow('Unexpected crypto events response');
  });
});

describe('filterCryptoEvents', () => {
  const events = [
    cryptoEvent({ id: 'late', startDate: '2026-12-01' }),
    cryptoEvent({ id: 'live', status: 'ongoing', startDate: '2026-10-10' }),
    cryptoEvent({ id: 'free', ticketType: 'free', startDate: '2026-11-15' }),
    cryptoEvent({ id: 'over', status: 'ended', ticketType: 'free', startDate: '2026-09-01' }),
  ];
  const ids = (list: CryptoEvent[]) => list.map((event) => event.id);

  it('drops ended events and sorts by start date for "all"', () => {
    expect(ids(filterCryptoEvents(events, 'all'))).toEqual(['live', 'free', 'late']);
  });

  it('filters by status', () => {
    expect(ids(filterCryptoEvents(events, 'ongoing'))).toEqual(['live']);
    expect(ids(filterCryptoEvents(events, 'upcoming'))).toEqual(['free', 'late']);
  });

  it('filters free events without resurfacing ended ones', () => {
    expect(ids(filterCryptoEvents(events, 'free'))).toEqual(['free']);
  });

  it('does not mutate the input list', () => {
    const snapshot = ids(events);
    filterCryptoEvents(events, 'all');
    expect(ids(events)).toEqual(snapshot);
  });
});

describe('crypto events cache', () => {
  const feed: CryptoEventsFeed = {
    events: [cryptoEvent()],
    source,
    fetchedAt: '2026-10-12T00:00:00Z',
  };
  let storage: Storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when nothing is cached', () => {
    expect(readCachedCryptoEvents()).toBeNull();
  });

  it('returns a fresh entry within the TTL', () => {
    writeCachedCryptoEvents(feed, 1_000);
    expect(readCachedCryptoEvents(1_000 + CRYPTO_EVENTS_CACHE_TTL_MS - 1)).toEqual({
      feed,
      isExpired: false,
    });
  });

  it('keeps expired entries but flags them', () => {
    writeCachedCryptoEvents(feed, 1_000);
    expect(readCachedCryptoEvents(1_000 + CRYPTO_EVENTS_CACHE_TTL_MS)?.isExpired).toBe(true);
  });

  it('discards malformed entries', () => {
    storage.setItem('pageshare_crypto_events_v1', JSON.stringify({ feed: {} }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(readCachedCryptoEvents()).toBeNull();
    expect(storage.length).toBe(0);
  });

  it('survives a storage quota error on write', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => writeCachedCryptoEvents(feed)).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });
});
