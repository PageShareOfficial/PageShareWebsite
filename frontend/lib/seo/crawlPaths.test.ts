import { describe, expect, it } from 'vitest';
import { isPathDisallowed, ROBOTS_DISALLOWED_PATHS, SITEMAP_PATHS } from './crawlPaths';

describe('crawlPaths', () => {
  it('never submits a sitemap path that robots.txt blocks', () => {
    const blockedSitemapPaths = SITEMAP_PATHS.filter((path) => isPathDisallowed(path));
    expect(blockedSitemapPaths).toEqual([]);
  });

  it('includes the homepage in the sitemap', () => {
    expect(SITEMAP_PATHS).toContain('');
  });

  it('treats every disallowed prefix and its children as blocked', () => {
    for (const disallowed of ROBOTS_DISALLOWED_PATHS) {
      expect(isPathDisallowed(disallowed)).toBe(true);
    }
    expect(isPathDisallowed('/settings/billing')).toBe(true);
  });

  it('allows public pages and the homepage', () => {
    expect(isPathDisallowed('')).toBe(false);
    expect(isPathDisallowed('/about')).toBe(false);
    expect(isPathDisallowed('/terms')).toBe(false);
  });
});
