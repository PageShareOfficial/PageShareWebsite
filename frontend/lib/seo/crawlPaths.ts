/**
 * Single source of truth for what crawlers may index (robots.ts) and what we submit (sitemap.ts).
 * A sitemap URL that robots.txt blocks is reported as an error in Google Search Console.
 */
export const ROBOTS_DISALLOWED_PATHS = [
  '/api/',
  '/home',
  '/onboarding',
  '/bookmarks',
  '/watchlist',
  '/settings',
  '/auth/',
  '/discover',
  '/plans',
  '/labs',
  '/coming-soon',
] as const;

export const SITEMAP_PATHS = ['', '/about', '/privacy', '/terms', '/cookies', '/disclaimer'] as const;

export function isPathDisallowed(path: string): boolean {
  const normalizedPath = path || '/';
  return ROBOTS_DISALLOWED_PATHS.some((disallowed) => normalizedPath.startsWith(disallowed));
}
