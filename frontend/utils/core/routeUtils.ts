import { RESERVED_ROUTES } from '@/utils/core/routeConstants';

/**
 * Check if a route segment is a reserved route (e.g. home, settings, api).
 * Used to avoid treating static routes as usernames. O(1) lookup.
 * Username validity is determined by the [username] page via API (backend is source of truth).
 */
export function isReservedRoute(segment: string): boolean {
  return RESERVED_ROUTES.has(segment.toLowerCase());
}
