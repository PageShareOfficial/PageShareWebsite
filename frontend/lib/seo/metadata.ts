/**
 * Shared SEO constants and helpers.
 * Set NEXT_PUBLIC_APP_URL in .env for production (e.g. https://www.pageshare.io).
 * It must match the primary Vercel domain so canonical, sitemap and og:url agree with what is served.
 */
const DEFAULT_SITE_URL = 'https://www.pageshare.io';

/**
 * Bump when the favicon artwork changes. Google caches favicons by URL, so a new query string
 * makes it fetch the new files instead of reusing the old cached icon.
 */
export const FAVICON_VERSION = '2';

export function normalizeSiteUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim();
  return (trimmed || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

export function versionedIconPath(path: string): string {
  return `${path}?v=${FAVICON_VERSION}`;
}

export const siteConfig = {
  name: 'PageShare',
  description:
    'PageShare is the trust layer for crypto predictions: locked records, objective settlement, and earned analyst credibility. Publish structured calls or compare track records with evidence.',
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL),
  ogImage: '/pageshare_final.webp',
} as const;
