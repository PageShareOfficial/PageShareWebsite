/**
 * Server-only: proxy cron requests to the backend with CRON_SECRET.
 * Used by Next.js API routes invoked by Vercel Cron.
 *
 * Vercel injects `Authorization: Bearer <CRON_SECRET>` when the project has
 * CRON_SECRET set — this is the supported way to verify cron invocations:
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
 */
import { getBaseUrl } from '@/lib/api/client';

const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_CRON_DAILY_PATH = '/api/v1/cron/daily';

/**
 * Node often resolves `localhost` to ::1 first; uvicorn may only listen on IPv4.
 * Using 127.0.0.1 avoids ECONNREFUSED on Windows/local dev when calling the API.
 */
function normalizeBackendOriginForServerFetch(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  try {
    const u = new URL(trimmed);
    if (u.hostname === 'localhost') {
      u.hostname = '127.0.0.1';
    }
    return u.origin;
  } catch {
    return trimmed;
  }
}

function getCronSecretTrimmed(): string {
  return typeof CRON_SECRET === 'string' ? CRON_SECRET.trim() : '';
}

/** True when CRON_SECRET is set (required for both Vercel auth and backend proxy). */
export function isCronSecretConfigured(): boolean {
  return getCronSecretTrimmed().length > 0;
}

/**
 * Validates that this request is from Vercel Cron by comparing the
 * Authorization bearer token to CRON_SECRET (same value Vercel sends).
 */
export function isAuthorizedVercelCronRequest(request: Request): boolean {
  const secret = getCronSecretTrimmed();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/**
 * Call the backend cron endpoint with X-Cron-Secret header.
 * Returns the backend Response, or null if config is missing (caller should return 503).
 * Sessions cron is run via GitHub Actions (calls backend directly); only daily is proxied here.
 */
export async function callBackendCron(path: 'daily'): Promise<Response | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl?.trim()) return null;
  const secret = getCronSecretTrimmed();
  if (!secret) return null;

  const origin = normalizeBackendOriginForServerFetch(baseUrl);
  const url = `${origin}${BACKEND_CRON_DAILY_PATH}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-Cron-Secret': secret },
    cache: 'no-store',
  });
  return response;
}
