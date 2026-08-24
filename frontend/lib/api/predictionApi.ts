/**
 * Predictions API: submit analyst predictions and read submission quota.
 */
import { apiFetch } from './client';

export interface PredictionSubmissionQuota {
  used: number;
  max: number;
  remaining: number;
}

export interface PredictionLivePrice {
  asset: string;
  product_id: string;
  price: number;
}

export interface CreatePredictionPayload {
  asset: string;
  asset_name?: string;
  position: 'long' | 'short';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  lock_started_at: string;
  expiry_at: string;
  confidence: number;
  thesis: string;
  thesis_image_url?: string;
}

export interface PredictionResponse {
  id: string;
  asset: string;
  asset_name?: string | null;
  prediction_type: string;
  position: 'long' | 'short';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  start_time: string;
  expiry_at: string;
  lock_started_at: string;
  confidence: number;
  thesis: string;
  thesis_image_url?: string | null;
  status: string;
  outcome?: 'win' | 'loss' | 'expired' | null;
  resolved_at?: string | null;
  hit_price?: number | null;
  hit_at?: string | null;
  return_pct?: number | null;
  resolution_source?: string | null;
  resolution_note?: string | null;
  content_hash?: string | null;
  anchor_status?: 'none' | 'pending' | 'submitted' | 'confirmed' | 'failed';
  chain_tx_hash?: string | null;
  chain_id?: number | null;
  anchored_at?: string | null;
  explorer_url?: string | null;
  created_at: string;
}

const CLIENT_TIMEZONE_HEADER = 'X-Client-Timezone';

function getClientTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function predictionRequestHeaders(): HeadersInit {
  const timezone = getClientTimezone();
  return timezone ? { [CLIENT_TIMEZONE_HEADER]: timezone } : {};
}

async function parseJsonResponse<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let message = fallback;
    try {
      const json = JSON.parse(text);
      const detail = json.detail ?? json.error?.message ?? json.message;
      message = typeof detail === 'string' ? detail : fallback;
    } catch {
      message = text || fallback;
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getPredictionLivePrice(
  asset: string,
  accessToken: string
): Promise<PredictionLivePrice> {
  const params = new URLSearchParams({ asset: asset.trim().toUpperCase() });
  const res = await apiFetch(`/predictions/live-price?${params.toString()}`, {
    method: 'GET',
    accessToken,
    headers: predictionRequestHeaders(),
  });
  return parseJsonResponse(res, 'Failed to load live price');
}

export async function getPredictionSubmissionQuota(
  accessToken: string
): Promise<PredictionSubmissionQuota> {
  const res = await apiFetch('/predictions/submission-quota', {
    method: 'GET',
    accessToken,
    headers: predictionRequestHeaders(),
  });
  return parseJsonResponse(res, 'Failed to load prediction quota');
}

export async function createPrediction(
  payload: CreatePredictionPayload,
  accessToken: string
): Promise<PredictionResponse> {
  const res = await apiFetch('/predictions', {
    method: 'POST',
    accessToken,
    headers: predictionRequestHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Failed to submit prediction');
}

export interface PredictionAnalyticsSubject {
  id: string;
  username: string;
  display_name?: string | null;
  profile_picture_url?: string | null;
  bio?: string | null;
  joined_at?: string | null;
}

export interface PredictionAnalyticsDashboard {
  subject: PredictionAnalyticsSubject;
  rank?: number | null;
  rank_total: number;
  net_rr_30d: number;
  recent_30d: {
    net_rr: number;
    win_rate_percent?: number | null;
    resolved_count: number;
    wins: number;
    losses: number;
    expired: number;
    net_return_percent?: number | null;
  };
  recent_30d_period_start: string;
  recent_30d_period_end: string;
  net_rr_series_30d: Array<{
    resolved_at: string;
    cumulative_net_rr: number;
  }>;
  resolved_returns_30d: Array<{
    index: number;
    outcome: 'win' | 'loss' | 'expired';
    return_percent: number;
    asset: string;
    resolved_at: string;
  }>;
  lifetime: {
    total_predictions: number;
    active_count: number;
    resolved_count: number;
    wins: number;
    losses: number;
    expired: number;
    win_rate_percent?: number | null;
    average_return_percent?: number | null;
    net_return_percent?: number | null;
    best_return_percent?: number | null;
    worst_return_percent?: number | null;
    max_trade_duration_hours?: number | null;
  };
  style: {
    long_count: number;
    short_count: number;
    long_percent?: number | null;
    short_percent?: number | null;
    top_assets: Array<{ asset: string; count: number }>;
    average_confidence?: number | null;
    average_setup_rr?: number | null;
  };
}

/** Compact analyst stats from GET /predictions/analytics/me/summary (predictions dashboard). */
export interface MyPredictionAnalyticsSummary {
  subject: PredictionAnalyticsSubject;
  total_predictions: number;
  wins: number;
  losses: number;
  win_rate_percent?: number | null;
  rank?: number | null;
}

export async function getMyPredictionAnalytics(
  accessToken: string
): Promise<PredictionAnalyticsDashboard> {
  const res = await apiFetch('/predictions/analytics/me', {
    method: 'GET',
    accessToken,
  });
  return parseJsonResponse(res, 'Failed to load analytics');
}

export async function getMyPredictionAnalyticsSummary(
  accessToken: string
): Promise<MyPredictionAnalyticsSummary> {
  const res = await apiFetch('/predictions/analytics/me/summary', {
    method: 'GET',
    accessToken,
  });
  return parseJsonResponse(res, 'Failed to load your stats');
}

export interface PredictionLeaderboardEntry {
  rank: number;
  username: string;
  display_name?: string | null;
  profile_picture_url?: string | null;
  subscription_plan_id?: string | null;
  avatar_initials?: string | null;
  net_rr_30d: number;
  win_rate_percent?: number | null;
  predictions_count: number;
  wins: number;
}

export interface ListPredictionLeaderboardResponse {
  data: PredictionLeaderboardEntry[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev?: boolean;
  };
}

export const LEADERBOARD_PAGE_SIZE = 20;

export async function getPredictionLeaderboard(
  accessToken?: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListPredictionLeaderboardResponse> {
  const search = new URLSearchParams();
  search.set('page', String(params?.page ?? 1));
  search.set('per_page', String(params?.per_page ?? LEADERBOARD_PAGE_SIZE));
  const res = await apiFetch(`/predictions/leaderboard?${search.toString()}`, {
    method: 'GET',
    accessToken: accessToken ?? undefined,
  });
  return parseJsonResponse(res, 'Failed to load leaderboard');
}

export async function getPredictionAnalyticsForUser(
  username: string,
  accessToken: string
): Promise<PredictionAnalyticsDashboard> {
  const encoded = encodeURIComponent(username.trim());
  const res = await apiFetch(`/predictions/analytics/users/${encoded}`, {
    method: 'GET',
    accessToken,
  });
  return parseJsonResponse(res, 'Failed to load analyst analytics');
}

export interface PredictionIndexItem {
  id: string;
  number: number;
  asset: string;
  status: string;
  outcome?: 'win' | 'loss' | 'expired' | null;
  created_at: string;
}

export interface PredictionIndexList {
  items: PredictionIndexItem[];
  total: number;
}

export interface PredictionAnalyticsDetail {
  number: number;
  prediction: PredictionResponse;
}

export async function getMyAnalyticsPredictionIndex(
  accessToken: string
): Promise<PredictionIndexList> {
  const res = await apiFetch('/predictions/analytics/me/predictions', {
    method: 'GET',
    accessToken,
  });
  return parseJsonResponse(res, 'Failed to load predictions');
}

export async function getMyAnalyticsPredictionDetail(
  predictionId: string,
  accessToken: string
): Promise<PredictionAnalyticsDetail> {
  const res = await apiFetch(
    `/predictions/analytics/me/predictions/${encodeURIComponent(predictionId)}`,
    {
      method: 'GET',
      accessToken,
    }
  );
  return parseJsonResponse(res, 'Failed to load prediction');
}

export async function getAnalyticsPredictionIndexForUser(
  username: string,
  accessToken: string
): Promise<PredictionIndexList> {
  const encoded = encodeURIComponent(username.trim());
  const res = await apiFetch(
    `/predictions/analytics/users/${encoded}/predictions`,
    {
      method: 'GET',
      accessToken,
    }
  );
  return parseJsonResponse(res, 'Failed to load predictions');
}

export async function getAnalyticsPredictionDetailForUser(
  username: string,
  predictionId: string,
  accessToken: string
): Promise<PredictionAnalyticsDetail> {
  const encoded = encodeURIComponent(username.trim());
  const res = await apiFetch(
    `/predictions/analytics/users/${encoded}/predictions/${encodeURIComponent(predictionId)}`,
    {
      method: 'GET',
      accessToken,
    }
  );
  return parseJsonResponse(res, 'Failed to load prediction');
}
