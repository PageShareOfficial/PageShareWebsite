import { afterEach, describe, expect, it } from 'vitest';
import {
  canGoBackInApp,
  recordPathnameChange,
  recordPopNavigation,
  resetNavigationHistory,
} from '@/utils/core/navigationHistory';

const NO_NAVIGATION_API = null;

afterEach(() => {
  resetNavigationHistory();
});

describe('canGoBackInApp with the Navigation API', () => {
  it('trusts navigation.canGoBack when available', () => {
    expect(canGoBackInApp({ canGoBack: true })).toBe(true);
    expect(canGoBackInApp({ canGoBack: false })).toBe(false);
  });

  it('ignores the fallback counter when the API is available', () => {
    recordPathnameChange('/home');
    recordPathnameChange('/alice');
    expect(canGoBackInApp({ canGoBack: false })).toBe(false);
  });
});

describe('canGoBackInApp fallback counter', () => {
  it('cannot go back on the first page (direct landing)', () => {
    recordPathnameChange('/alice/posts/1');
    expect(canGoBackInApp(NO_NAVIGATION_API)).toBe(false);
  });

  it('can go back after an in-app navigation', () => {
    recordPathnameChange('/home');
    recordPathnameChange('/alice');
    expect(canGoBackInApp(NO_NAVIGATION_API)).toBe(true);
  });

  it('ignores re-renders on the same pathname', () => {
    recordPathnameChange('/home');
    recordPathnameChange('/home');
    expect(canGoBackInApp(NO_NAVIGATION_API)).toBe(false);
  });

  it('decrements when the browser navigates back', () => {
    recordPathnameChange('/home');
    recordPathnameChange('/alice');
    recordPopNavigation();
    recordPathnameChange('/home');
    expect(canGoBackInApp(NO_NAVIGATION_API)).toBe(false);
  });

  it('never goes below zero', () => {
    recordPathnameChange('/alice');
    recordPopNavigation();
    recordPathnameChange('/home');
    expect(canGoBackInApp(NO_NAVIGATION_API)).toBe(false);
  });
});
