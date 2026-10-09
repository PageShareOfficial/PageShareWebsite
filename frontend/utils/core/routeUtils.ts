import { AUTH_PROTECTED_ROUTES, RESERVED_ROUTES } from '@/utils/core/routeConstants';

/** Mirrors the backend/DB username rule (^[a-z0-9_]{3,50}$); URLs may use any letter case. */
const USERNAME_SEGMENT_PATTERN = /^[a-z0-9_]{3,50}$/i;
const FILE_EXTENSION_PATTERN = /\.[a-z0-9]+$/i;

/**
 * Check if a route segment is a reserved route (e.g. home, settings, api).
 * Used to avoid treating static routes as usernames. O(1) lookup.
 * Username existence is determined by the [username] page via API (backend is source of truth).
 */
export function isReservedRoute(segment: string): boolean {
  return RESERVED_ROUTES.has(segment.toLowerCase());
}

/** True when a URL segment has a shape that could belong to a real account. */
export function isValidUsernameSegment(segment: string): boolean {
  return USERNAME_SEGMENT_PATTERN.test(segment);
}

/**
 * True for paths that look like public files (e.g. /favicon.ico, /story/image-01.png),
 * which the proxy may serve without an auth check. Paths under auth-protected sections never
 * qualify, so a fake extension (e.g. /ticker/btc.png) cannot bypass sign-in.
 */
export function isPublicAssetPath(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (!lastSegment || !FILE_EXTENSION_PATTERN.test(lastSegment)) return false;
  return !AUTH_PROTECTED_ROUTES.has(segments[0].toLowerCase());
}
