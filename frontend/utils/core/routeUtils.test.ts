import { describe, expect, it } from 'vitest';
import {
  isPublicAssetPath,
  isReservedRoute,
  isValidUsernameSegment,
} from '@/utils/core/routeUtils';
import { AUTH_PROTECTED_ROUTES } from '@/utils/core/routeConstants';

describe('isReservedRoute', () => {
  it('matches reserved segments case-insensitively', () => {
    expect(isReservedRoute('home')).toBe(true);
    expect(isReservedRoute('Settings')).toBe(true);
    expect(isReservedRoute('johndoe')).toBe(false);
  });
});

describe('isValidUsernameSegment', () => {
  it.each(['abc', 'john_doe', 'User123', 'a'.repeat(50)])('accepts "%s"', (segment) => {
    expect(isValidUsernameSegment(segment)).toBe(true);
  });

  it.each([
    'pageshare-final.jpg',
    'pageshare_final.webp',
    'ab',
    'a'.repeat(51),
    'john.doe',
    'john-doe',
    'john%20doe',
    '',
  ])('rejects "%s"', (segment) => {
    expect(isValidUsernameSegment(segment)).toBe(false);
  });
});

describe('isPublicAssetPath', () => {
  it.each(['/favicon.ico', '/pageshare_final.webp', '/story/image-01.png', '/sitemap.xml'])(
    'treats %s as a public asset',
    (pathname) => {
      expect(isPublicAssetPath(pathname)).toBe(true);
    }
  );

  it.each(['/', '/home', '/johndoe', '/johndoe/posts/123'])(
    'does not treat %s as an asset',
    (pathname) => {
      expect(isPublicAssetPath(pathname)).toBe(false);
    }
  );

  it.each([...AUTH_PROTECTED_ROUTES])('never skips auth for fake files under /%s', (segment) => {
    expect(isPublicAssetPath(`/${segment}/fake.png`)).toBe(false);
    expect(isPublicAssetPath(`/${segment.toUpperCase()}/fake.png`)).toBe(false);
  });
});
