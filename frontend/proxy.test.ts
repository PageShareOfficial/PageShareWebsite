import { describe, expect, it } from 'vitest';
import { config } from './proxy';
import { AUTH_PROTECTED_ROUTES } from '@/utils/core/routeConstants';

const [matcherSource] = config.matcher;
const matcher = new RegExp(`^${matcherSource}$`);

describe('proxy matcher', () => {
  it.each(['/favicon.ico', '/pageshare_final.webp', '/story/image-01.png', '/_next/static/x.js'])(
    'skips static asset %s',
    (pathname) => {
      expect(matcher.test(pathname)).toBe(false);
    }
  );

  it.each(['/', '/home', '/johndoe', '/johndoe/posts/123'])('runs for page %s', (pathname) => {
    expect(matcher.test(pathname)).toBe(true);
  });

  it.each([...AUTH_PROTECTED_ROUTES])(
    'runs for fake files under protected /%s so sign-in cannot be bypassed',
    (segment) => {
      expect(matcher.test(`/${segment}/fake.png`)).toBe(true);
    }
  );
});
