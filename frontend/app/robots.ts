import { MetadataRoute } from 'next';
import { ROBOTS_DISALLOWED_PATHS } from '@/lib/seo/crawlPaths';
import { siteConfig } from '@/lib/seo/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...ROBOTS_DISALLOWED_PATHS],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
