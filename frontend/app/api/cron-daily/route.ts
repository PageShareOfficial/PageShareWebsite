import { NextRequest, NextResponse } from 'next/server';
import {
  callBackendCron,
  isAuthorizedVercelCronRequest,
  isCronSecretConfigured,
} from '@/lib/api/cronProxy';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

export const dynamic = 'force-dynamic';

/**
 * Proxy for backend GET /api/v1/cron/daily.
 * Invoked by Vercel Cron (schedule: daily 05:00 UTC). Refreshes materialized
 * views and runs stale session cleanup. Requires CRON_SECRET (sent by Vercel
 * as Authorization: Bearer) and NEXT_PUBLIC_API_URL for the backend.
 */
export async function GET(request: NextRequest) {
  if (!isCronSecretConfigured()) {
    return NextResponse.json(
      { error: 'Cron not configured (missing CRON_SECRET)' },
      { status: 503 }
    );
  }

  if (!isAuthorizedVercelCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let response: Response | null;
  try {
    response = await callBackendCron('daily');
  } catch (err) {
    const detail = getErrorMessage(err, 'Network error');
    return NextResponse.json(
      {
        error: 'Backend unreachable',
        detail,
        hint:
          /ECONNREFUSED|fetch failed/i.test(detail) || err instanceof TypeError
            ? 'Ensure the API is running (e.g. uvicorn on port 8000). On Windows, prefer NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 if localhost misbehaves.'
            : undefined,
      },
      { status: 502 }
    );
  }

  if (!response) {
    return NextResponse.json(
      { error: 'Cron not configured (missing backend URL — set NEXT_PUBLIC_API_URL)' },
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
