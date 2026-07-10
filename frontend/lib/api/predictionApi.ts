/**
 * Predictions API: submit analyst predictions and read submission quota.
 */
import { apiFetch } from './client';

export interface PredictionSubmissionQuota {
  used: number;
  max: number;
  remaining: number;
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
