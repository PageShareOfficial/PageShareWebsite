import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicAssetPath, isReservedRoute } from '@/utils/core/routeUtils';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // A missing "file" falls through to dynamic routes, so only skip auth outside protected sections.
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  // Auth: refresh session, protect routes, redirect authenticated users from /
  const authResponse = await updateSession(request);
  if (authResponse.status === 307 || authResponse.status === 302) {
    return authResponse;
  }

  // Get the first path segment (e.g., /johndoe/followers -> johndoe)
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return NextResponse.next();
  }

  const firstSegment = segments[0].toLowerCase();

  // If it's a reserved route (home, settings, etc.), continue; otherwise could be username
  if (isReservedRoute(firstSegment)) {
    return NextResponse.next();
  }

  // Let it through; [username] page validates via API and returns 404 if not found
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, fonts, etc.), except under AUTH_PROTECTED_ROUTES
     *   (kept in sync by proxy.test.ts) so a fake extension cannot bypass sign-in
     */
    '/((?!_next/static|_next/image|favicon.ico|_next|(?!(?:home|predictions|submit-prediction|analytics|myanalysts|onboarding|settings|bookmarks|watchlist|ticker)(?:/|$)).*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|json)$).*)',
  ],
};
