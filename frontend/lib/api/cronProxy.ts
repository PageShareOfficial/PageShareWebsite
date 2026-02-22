/**
 * Server-only: proxy cron requests to the backend with CRON_SECRET.
 * Used by Next.js API routes invoked by Vercel Cron.
 */
import { getBaseUrl } from '@/lib/api/client';

const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_CRON_PATHS: Record<string, string> = {
  daily: '/api/v1/cron/daily',
  sessions: '/api/v1/cron/sessions',
  trending: '/api/v1/cron/trending',
};

/**
 * Call the backend cron endpoint with X-Cron-Secret header.
 * Returns the backend Response, or null if config is missing (caller should return 503).
 */
export async function callBackendCron(
  path: 'daily' | 'sessions' | 'trending'
): Promise<Response | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl?.trim()) return null;
  const secret = typeof CRON_SECRET === 'string' ? CRON_SECRET.trim() : '';
  if (!secret) return null;

  const endpointPath = BACKEND_CRON_PATHS[path];
  if (!endpointPath) return null;
  const url = `${baseUrl.replace(/\/$/, '')}${endpointPath}`;

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
