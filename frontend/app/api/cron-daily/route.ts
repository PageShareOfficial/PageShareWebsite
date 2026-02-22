import { NextRequest, NextResponse } from 'next/server';
import { callBackendCron, isCronRequest } from '@/lib/api/cronProxy';

export const dynamic = 'force-dynamic';

/**
 * Proxy for backend GET /api/v1/cron/daily.
 * Invoked by Vercel Cron (schedule: daily 05:00 UTC). Refreshes materialized
 * views and runs stale session cleanup. Requires CRON_SECRET and backend URL in env.
 */
export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = await callBackendCron('daily');
  if (!response) {
    return NextResponse.json(
      { error: 'Cron not configured (missing CRON_SECRET or backend URL)' },
      { status: 503 }
    );
  }

  const body = await response.text();
  const contentType = response.headers.get('content-type') ?? 'application/json';
  return new NextResponse(body, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  });
}
