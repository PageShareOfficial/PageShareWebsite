import { MetadataRoute } from 'next';
import { SITEMAP_PATHS } from '@/lib/seo/crawlPaths';
import { siteConfig } from '@/lib/seo/metadata';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

function getChangeFrequency(path: string): ChangeFrequency {
  return path === '' ? 'weekly' : 'monthly';
}

function getPriority(path: string): number {
  return path === '' ? 1 : 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(path),
    priority: getPriority(path),
  }));
}
