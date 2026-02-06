import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_PROTECTED_ROUTES } from '@/utils/core/routeConstants';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles cookie refresh so the session stays valid.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase() ?? '';

  const isProtected = AUTH_PROTECTED_ROUTES.has(firstSegment);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) =>
      redirectRes.cookies.set(c.name, c.value)
    );
    return redirectRes;
  }

  if (user && firstSegment === '' && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) =>
      redirectRes.cookies.set(c.name, c.value)
    );
    return redirectRes;
  }

  return response;
}
