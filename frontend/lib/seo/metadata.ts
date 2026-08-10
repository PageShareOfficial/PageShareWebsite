/**
 * Shared SEO constants and helpers.
 * Set NEXT_PUBLIC_APP_URL in .env for production (e.g. https://pageshare.io)
 */
export const siteConfig = {
  name: 'PageShare',
  description:
    'PageShare is the trust layer for crypto predictions: locked records, objective settlement, and earned analyst credibility. Publish structured calls or compare track records with evidence.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io',
  ogImage: '/pageshare_final.png',
} as const;
