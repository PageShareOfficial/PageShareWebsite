/**
 * Server-only: proxy cron requests to the backend with CRON_SECRET.
 * Used by Next.js API routes invoked by Vercel Cron.
 */
import { getBaseUrl } from '@/lib/api/client';

const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_CRON_DAILY_PATH = '/api/v1/cron/daily';

/**
 * Call the backend cron endpoint with X-Cron-Secret header.
 * Returns the backend Response, or null if config is missing (caller should return 503).
 * Sessions cron is run via GitHub Actions (calls backend directly); only daily is proxied here.
 */
export async function callBackendCron(path: 'daily'): Promise<Response | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl?.trim()) return null;
  const secret = typeof CRON_SECRET === 'string' ? CRON_SECRET.trim() : '';
  if (!secret) return null;

  const url = `${baseUrl.replace(/\/$/, '')}${BACKEND_CRON_DAILY_PATH}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-Cron-Secret': secret },
    cache: 'no-store',
  });
  return response;
}

export function isCronRequest(request: Request): boolean {
  return request.headers.get('x-vercel-cron') === '1';
}
