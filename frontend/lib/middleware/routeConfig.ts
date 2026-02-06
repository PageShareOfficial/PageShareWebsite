import { mockUsers } from '@/data/mockData';
import { RESERVED_ROUTES } from '@/utils/core/routeConstants';

/**
 * Get valid usernames from mock data.
 * In production, this would query the database or use an API.
 */
export function getValidUsernamesForMiddleware(): Set<string> {
  return new Set(Object.keys(mockUsers).map((u) => u.toLowerCase()));
}

/**
 * Check if a path segment is a reserved route
 */
export function isReservedRouteInMiddleware(segment: string): boolean {
  return RESERVED_ROUTES.has(segment.toLowerCase());
}

/**
 * Check if a path segment is a valid username (from mock data)
 * Note: Middleware runs server-side, so we can't check localStorage here.
 * The [username] page will do a full check including localStorage.
 */
export function isValidUsernameInMiddleware(segment: string, validUsernames: Set<string>): boolean {
  return validUsernames.has(segment.toLowerCase());
}
