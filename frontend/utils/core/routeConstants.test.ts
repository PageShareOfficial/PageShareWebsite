import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { AUTH_PROTECTED_ROUTES, RESERVED_ROUTES } from '@/utils/core/routeConstants';

const APP_DIRECTORY = path.resolve(__dirname, '../../app');

function isRouteGroup(name: string): boolean {
  return name.startsWith('(') && name.endsWith(')');
}

/** Dynamic ([x]), private (_x) and parallel (@x) folders are not literal URL segments. */
function isLiteralSegment(name: string): boolean {
  return !name.startsWith('[') && !name.startsWith('_') && !name.startsWith('@');
}

/** First URL segments served by the app directory, looking through route groups like (app). */
function collectTopLevelSegments(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      if (isRouteGroup(entry.name)) {
        return collectTopLevelSegments(path.join(directory, entry.name));
      }
      return isLiteralSegment(entry.name) ? [entry.name] : [];
    });
}

describe('RESERVED_ROUTES', () => {
  const topLevelSegments = collectTopLevelSegments(APP_DIRECTORY);

  it('finds the app routes (sanity check)', () => {
    expect(topLevelSegments).toEqual(expect.arrayContaining(['home', 'settings', 'ticker']));
  });

  it.each(topLevelSegments)(
    'reserves "%s" so middleware does not treat it as a username',
    (segment) => {
      expect(RESERVED_ROUTES.has(segment.toLowerCase())).toBe(true);
    }
  );
});

describe('AUTH_PROTECTED_ROUTES', () => {
  it('only contains reserved routes', () => {
    for (const segment of AUTH_PROTECTED_ROUTES) {
      expect(RESERVED_ROUTES.has(segment)).toBe(true);
    }
  });

  it('keeps ticker pages behind sign-in', () => {
    expect(AUTH_PROTECTED_ROUTES.has('ticker')).toBe(true);
  });
});
