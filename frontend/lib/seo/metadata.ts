/**
 * Shared SEO constants and helpers.
 * Set NEXT_PUBLIC_APP_URL in .env for production (e.g. https://pageshare.io)
 */
export const siteConfig = {
  name: 'PageShare',
  description:
    "A social platform built exclusively for crypto traders and investors. Track tokens, follow narratives, uncover early signals, and explore AI-powered crypto tools.",
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io',
  ogImage: '/pageshare_final.png',
} as const;
