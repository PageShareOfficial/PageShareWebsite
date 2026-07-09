/**
 * Shared SEO constants and helpers.
 * Set NEXT_PUBLIC_APP_URL in .env for production (e.g. https://pageshare.io)
 */
export const siteConfig = {
  name: 'PageShare',
  description:
    "PageShare turns market ideas into structured predictions, measurable track records, and actionable intelligence for traders, analysts, investors, and institutions. Verified Predictions • Analyst Credibility • AI Powered Research • Early Narratives",
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io',
  ogImage: '/pageshare_final.png',
} as const;
