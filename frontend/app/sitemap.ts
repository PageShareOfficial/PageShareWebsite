import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pageshare.io';

function getChangeFrequency(
  path: string
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  if (path === '') return 'weekly';
  if (path === '/discover') return 'daily';
  return 'monthly';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/discover',
    '/plans',
    '/privacy',
    '/terms',
    '/cookies',
    '/disclaimer',
  ];

  return staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(path),
    priority: path === '' ? 1 : path === '/discover' ? 0.9 : 0.7,
  }));
}
