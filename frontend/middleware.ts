import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isReservedRoute } from '@/utils/core/routeUtils';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Early exit for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like favicon.ico, images, etc.
  ) {
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
     * - public folder files (images, fonts, etc.)
     * Optimized to skip static assets faster
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|json)$|_next).*)',
  ],
};
