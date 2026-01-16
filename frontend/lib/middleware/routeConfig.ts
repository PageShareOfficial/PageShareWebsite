import { mockUsers } from '@/data/mockData';

/**
 * Reserved routes that should NOT be treated as usernames.
 * These are static routes in the app that take priority over dynamic [username] routes.
 * Keep in sync with utils/routeUtils.ts
 */
export const RESERVED_ROUTES = new Set([
  // Current routes
  'api',
  'bookmarks',
  'cookies',
  'home',
  'labs',
  'onboarding',
  'plans',
  'privacy',
  'settings',
  'terms',
  'watchlist',
  
  // Future routes
  'discover',
  'explore',
  'notifications',
  'messages',
  'search',
  'trending',
  'help',
  'about',
  'support',
  'login',
  'signup',
  'logout',
  'register',
  'auth',
  'admin',
  'dashboard',
]);

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
