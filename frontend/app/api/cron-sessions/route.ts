import { NextRequest, NextResponse } from 'next/server';
import { callBackendCron, isCronRequest } from '@/lib/api/cronProxy';

export const dynamic = 'force-dynamic';

/**
 * Proxy for backend GET /api/v1/cron/sessions.
 * Invoked by Vercel Cron (schedule: every 30 min). Closes stale sessions.
 * Requires CRON_SECRET and backend URL in env.
 */
export async function GET(request: NextRequest) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = await callBackendCron('sessions');
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
