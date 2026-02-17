/**
 * Route-related constants shared between client code, middleware, and utilities.
 * Keeping them here avoids duplication and keeps behavior consistent.
 */

/**
 * Reserved routes that should NOT be treated as usernames.
 * These are static routes in the app that take priority over dynamic [username] routes.
 */
export const RESERVED_ROUTES = new Set<string>([
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
  'offline',

  // Future routes (reserve them now to prevent username conflicts)
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

  // System routes
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

/**
 * Routes that require an authenticated user.
 * Middleware uses this to decide when to redirect anonymous users.
 */
export const AUTH_PROTECTED_ROUTES = new Set<string>([
  'home',
  'onboarding',
  'settings',
  'bookmarks',
  'watchlist',
]);

/**
 * Auth-related routes (login, reset, callback).
 * Used by middleware to allow unauthenticated access.
 */
export const AUTH_ROUTES = new Set<string>([
  'auth',
]);

