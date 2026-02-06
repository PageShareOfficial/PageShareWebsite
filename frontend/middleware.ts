import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getValidUsernamesForMiddleware,
  isReservedRouteInMiddleware,
  isValidUsernameInMiddleware,
} from '@/lib/middleware/routeConfig';
import { updateSession } from '@/lib/supabase/middleware';

// Get valid usernames from mock data (cached at module load)
// In production: replace with database lookup or remove (let [username] page handle validation)
const VALID_USERNAMES = getValidUsernamesForMiddleware();

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

  // Fast check: If it's a reserved route, exit immediately (O(1) lookup)
  if (isReservedRouteInMiddleware(firstSegment)) {
    return NextResponse.next();
  }

  // At this point, the route could be a username
  if (isValidUsernameInMiddleware(firstSegment, VALID_USERNAMES)) {
    return NextResponse.next();
  }

  // Let it through and let the [username] page handle the 404
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
