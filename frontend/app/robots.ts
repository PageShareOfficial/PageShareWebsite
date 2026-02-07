import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
