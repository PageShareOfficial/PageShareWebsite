/**
 * Log frontend errors to the backend (POST /api/v1/errors/log).
 * Only sends when backend base URL is configured. No auth required.
 */
import { getBaseUrl } from '@/lib/api/client';

export interface LogErrorPayload {
  error_type: 'frontend' | 'api';
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  page_url?: string;
  user_agent?: string;
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  metadata?: Record<string, unknown>;
}

/**
 * Send error to backend error log. Fire-and-forget; never throws.
 */
export function logErrorToBackend(payload: LogErrorPayload): void {
  if (typeof window === 'undefined') return;
  const baseUrl = getBaseUrl();
  if (!baseUrl) return;

  const url = `${baseUrl}/api/v1/errors/log`;
  const body: LogErrorPayload = {
    ...payload,
    severity: payload.severity ?? 'error',
  };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Silently ignore network errors to avoid secondary errors
  });
}
