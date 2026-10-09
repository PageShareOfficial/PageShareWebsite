import { describe, expect, it } from 'vitest';
import { FAVICON_VERSION, normalizeSiteUrl, versionedIconPath } from './metadata';

describe('normalizeSiteUrl', () => {
  it('defaults to the www host when unset or blank', () => {
    expect(normalizeSiteUrl(undefined)).toBe('https://www.pageshare.io');
    expect(normalizeSiteUrl('   ')).toBe('https://www.pageshare.io');
  });

  it('strips trailing slashes so joined paths never contain //', () => {
    expect(normalizeSiteUrl('https://www.pageshare.io/')).toBe('https://www.pageshare.io');
    expect(normalizeSiteUrl('https://staging.pageshare.io//')).toBe('https://staging.pageshare.io');
  });

  it('keeps a configured URL as-is', () => {
    expect(normalizeSiteUrl('https://preview.pageshare.io')).toBe('https://preview.pageshare.io');
  });
});

describe('versionedIconPath', () => {
  it('appends the favicon version as a cache-busting query', () => {
    expect(versionedIconPath('/favicon.ico')).toBe(`/favicon.ico?v=${FAVICON_VERSION}`);
  });
});
