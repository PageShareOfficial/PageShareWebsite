import { MetadataRoute } from 'next';
import { SITEMAP_PATHS } from '@/lib/seo/crawlPaths';
import { siteConfig } from '@/lib/seo/metadata';

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;

/** Pages whose content changes every day, so crawlers should revisit them often. */
const DAILY_PATHS: ReadonlySet<string> = new Set(['/events']);

function getChangeFrequency(path: string): ChangeFrequency {
  if (DAILY_PATHS.has(path)) return 'daily';
  return path === '' ? 'weekly' : 'monthly';
}

function getPriority(path: string): number {
  if (path === '') return 1;
  return DAILY_PATHS.has(path) ? 0.8 : 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PATHS.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(path),
    priority: getPriority(path),
  }));
}
