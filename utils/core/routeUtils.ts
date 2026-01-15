import { mockUsers } from '@/data/mockData';

/**
 * List of reserved routes that should NOT be treated as usernames
 * These are static routes in the app that take priority over dynamic [username] routes
 * Using Set for O(1) lookup performance
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
 * Check if a route segment is a reserved route
 * O(1) lookup using Set
 */
export function isReservedRoute(segment: string): boolean {
  return RESERVED_ROUTES.has(segment.toLowerCase());
}

/**
 * Get all valid usernames from mock data
 * In production, this would query the database
 */
export function getValidUsernames(): string[] {
  return Object.keys(mockUsers);
}

/**
 * Check if a username exists in the mock data
 * In production, this would query the database
 */
export function isValidUsername(username: string): boolean {
  // Check in mock users
  if (mockUsers[username.toLowerCase()]) {
    return true;
  }
  
  // Also check localStorage for dynamically created users
  if (typeof window !== 'undefined') {
    const profileKey = `pageshare_profile_${username.toLowerCase()}`;
    const savedProfile = localStorage.getItem(profileKey);
    if (savedProfile) {
      return true;
    }
  }
  
  return false;
}

/**
 * Server-side check for valid username (for middleware)
 * Only checks mock data since localStorage isn't available server-side
 */
export function isValidUsernameServer(username: string): boolean {
  return !!mockUsers[username.toLowerCase()];
}
