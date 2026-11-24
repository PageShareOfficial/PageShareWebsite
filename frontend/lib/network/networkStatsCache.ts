import { getNetworkStats, type NetworkStats } from '@/lib/api/networkApi';

/** Matches backend `s-maxage=120` on GET /network/stats */
const STALE_MS = 120_000;

const EMPTY: NetworkStats = {
  total_predictions: 0,
  verified_predictions: 0,
  publishing_analysts: 0,
  saved_analysts: 0,
  saving_investors: 0,
};

export type NetworkStatsSnapshot = {
  stats: NetworkStats;
  loading: boolean;
};

let cachedStats: NetworkStats | null = null;
let fetchedAt = 0;
let loading = false;
let inflight: Promise<NetworkStats> | null = null;

const subscribers = new Set<() => void>();

let snapshot: NetworkStatsSnapshot = { stats: EMPTY, loading: false };

function isFresh(): boolean {
  return cachedStats !== null && Date.now() - fetchedAt < STALE_MS;
}

function buildSnapshot(): NetworkStatsSnapshot {
  return {
    stats: cachedStats ?? EMPTY,
    loading: loading || (cachedStats === null && inflight !== null),
  };
}

function publish(): void {
  snapshot = buildSnapshot();
  subscribers.forEach((listener) => listener());
}

function persistStats(stats: NetworkStats): NetworkStats {
  cachedStats = stats;
  fetchedAt = Date.now();
  return stats;
}

export function subscribeNetworkStats(listener: () => void): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function getNetworkStatsSnapshot(): NetworkStatsSnapshot {
  return snapshot;
}

/** Stable reference required by React `useSyncExternalStore` on the server. */
const SERVER_SNAPSHOT: NetworkStatsSnapshot = { stats: EMPTY, loading: true };

export function getNetworkStatsServerSnapshot(): NetworkStatsSnapshot {
  return SERVER_SNAPSHOT;
}

/** One shared fetch per stale window; concurrent callers share the same promise. */
export function requestNetworkStats(): Promise<NetworkStats> {
  if (isFresh()) {
    return Promise.resolve(cachedStats as NetworkStats);
  }
  if (inflight) {
    return inflight;
  }

  loading = true;
  publish();

  inflight = getNetworkStats()
    .then((stats) => persistStats(stats))
    .catch(() => {
      if (cachedStats === null) {
        cachedStats = EMPTY;
      }
      return cachedStats;
    })
    .finally(() => {
      loading = false;
      inflight = null;
      publish();
    });

  return inflight;
}
