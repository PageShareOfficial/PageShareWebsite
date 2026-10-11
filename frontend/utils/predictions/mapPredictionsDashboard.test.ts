import { describe, expect, it } from 'vitest';
import type { PredictionLeaderboardEntry } from '@/lib/api/predictionApi';
import { mapLeaderboardEntry } from '@/utils/predictions/mapPredictionsDashboard';

const API_ENTRY: PredictionLeaderboardEntry = {
  rank: 2,
  username: 'mayacrypto',
  display_name: 'Maya Chen',
  net_rr_30d: 3.5,
  win_rate_percent: 70,
  predictions_count: 12,
  wins: 7,
  pending_count: 3,
};

describe('mapLeaderboardEntry', () => {
  it('maps the pending count', () => {
    expect(mapLeaderboardEntry(API_ENTRY).pendingCount).toBe(3);
  });

  it('defaults pending count to 0 when the API omits it', () => {
    const { pending_count: _omitted, ...withoutPending } = API_ENTRY;
    expect(mapLeaderboardEntry(withoutPending).pendingCount).toBe(0);
  });

  it('keeps the resolved counts alongside pending', () => {
    const entry = mapLeaderboardEntry(API_ENTRY);
    expect(entry.predictionsCount).toBe(12);
    expect(entry.verifiedCount).toBe(7);
  });
});
