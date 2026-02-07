/**
 * Shared SEO constants and helpers.
 * Set NEXT_PUBLIC_APP_URL in .env for production (e.g. https://pageshare.io)
 */
export const siteConfig = {
  name: 'PageShare',
  description:
    "A social platform for sharing thoughts and ideas about Stock markets, NFT's and Crypto",
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io',
  ogImage: '/pageshare_final.png',
} as const;
