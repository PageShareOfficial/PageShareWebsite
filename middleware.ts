import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getValidUsernamesForMiddleware,
  isReservedRouteInMiddleware,
  isValidUsernameInMiddleware,
} from '@/lib/middleware/routeConfig';

// Get valid usernames from mock data (cached at module load)
// In production: replace with database lookup or remove (let [username] page handle validation)
const VALID_USERNAMES = getValidUsernamesForMiddleware();

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Early exit for static files and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }
  
  // Get the first path segment (e.g., /johndoe/followers -> johndoe)
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    // Root path (/), let it through
    return NextResponse.next();
  }
  
  const firstSegment = segments[0].toLowerCase();
  
  // Fast check: If it's a reserved route, exit immediately (O(1) lookup)
  // Reserved routes are static and don't need username validation
  if (isReservedRouteInMiddleware(firstSegment)) {
    return NextResponse.next();
  }
  
  // At this point, the route could be a username
  // If it's a valid username (in mock data), let it through to [username] route
  // Note: Users created via localStorage will be validated in the [username] page
  // since middleware runs server-side and can't access localStorage
  // This is O(1) lookup with Set
  if (isValidUsernameInMiddleware(firstSegment, VALID_USERNAMES)) {
    return NextResponse.next();
  }
  
  // Not a reserved route and not a valid username
  // Let it through and let the [username] page handle the 404
  // This allows for dynamically created users via localStorage
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
