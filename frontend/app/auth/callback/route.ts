import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_ERROR_CODES, landingWithError, ROUTES } from '@/constants/routes';
import { requireSupabasePublicConfig } from '@/lib/supabase/publicEnv';
import { AccountLoadError } from '@/utils/auth/accountLoadError';
import { resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export const dynamic = 'force-dynamic';

/**
 * Google and email-confirmation links land here. The exchange and the onboarding check run on
 * the server, then the browser is redirected once. There is no client page to wait on.
 * Session tracking stays on the destination page, so it never delays this redirect.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return redirectTo(request, landingWithError(AUTH_ERROR_CODES.auth), []);
  }

  const sessionCookies: CookieToSet[] = [];
  const destination = await destinationForCode(request, code, sessionCookies);
  return redirectTo(request, destination, sessionCookies);
}

async function destinationForCode(
  request: NextRequest,
  code: string,
  sessionCookies: CookieToSet[]
): Promise<string> {
  const accessToken = await exchangeCode(request, code, sessionCookies);
  if (!accessToken) return landingWithError(AUTH_ERROR_CODES.auth);

  try {
    return await resolvePostAuthPath(accessToken);
  } catch (err) {
    if (err instanceof AccountLoadError) return ROUTES.accountError;
    throw err;
  }
}

async function exchangeCode(
  request: NextRequest,
  code: string,
  sessionCookies: CookieToSet[]
): Promise<string | null> {
  const { url, publishableKey } = requireSupabasePublicConfig();
  try {
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // Written onto the redirect below. next/headers cookies() never leave with it.
        setAll: (cookies: CookieToSet[]) => {
          sessionCookies.splice(0, sessionCookies.length, ...cookies);
        },
      },
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session?.access_token) {
      console.error('[auth/callback] code exchange rejected', error ?? 'missing access token');
      return null;
    }
    return data.session.access_token;
  } catch (err) {
    console.error('[auth/callback] code exchange failed', err);
    return null;
  }
}

function redirectTo(request: NextRequest, path: string, sessionCookies: CookieToSet[]) {
  const url = request.nextUrl.clone();
  const target = new URL(path, request.nextUrl.origin);
  url.pathname = target.pathname;
  url.search = target.search;
  const response = NextResponse.redirect(url);
  applySessionCookies(response, sessionCookies);
  return response;
}

function applySessionCookies(response: NextResponse, sessionCookies: CookieToSet[]): void {
  for (const { name, value, options } of sessionCookies) {
    response.cookies.set(name, value, options);
  }
}
