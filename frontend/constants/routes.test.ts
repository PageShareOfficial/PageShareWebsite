import { describe, expect, it } from 'vitest';
import {
  AUTH_ERROR_CODES,
  ROUTES,
  SETTINGS_DELETE_ACCOUNT_QUERY,
  comingSoonPath,
  followersPath,
  getAnalyticsPath,
  isAuthErrorCode,
  landingWithError,
  postPath,
  profilePath,
  profileTabPath,
  settingsDeleteAccountPath,
  tickerPath,
} from '@/constants/routes';

describe('ROUTES', () => {
  it('exposes the static app paths', () => {
    expect(ROUTES.landing).toBe('/');
    expect(ROUTES.home).toBe('/home');
    expect(ROUTES.predictions).toBe('/predictions');
    expect(ROUTES.submitPrediction).toBe('/submit-prediction');
    expect(ROUTES.settings).toBe('/settings');
    expect(ROUTES.billing).toBe('/settings/billing');
    expect(ROUTES.onboarding).toBe('/onboarding');
    expect(ROUTES.plans).toBe('/plans');
    expect(ROUTES.myAnalysts).toBe('/myanalysts');
  });

  it('exposes the app navigation paths', () => {
    expect(ROUTES.discover).toBe('/discover');
    expect(ROUTES.labs).toBe('/labs');
    expect(ROUTES.watchlist).toBe('/watchlist');
    expect(ROUTES.bookmarks).toBe('/bookmarks');
  });

  it('exposes the public info and legal paths', () => {
    expect(ROUTES.about).toBe('/about');
    expect(ROUTES.terms).toBe('/terms');
    expect(ROUTES.privacy).toBe('/privacy');
    expect(ROUTES.cookies).toBe('/cookies');
    expect(ROUTES.disclaimer).toBe('/disclaimer');
    expect(ROUTES.comingSoon).toBe('/coming-soon');
  });
});

describe('comingSoonPath', () => {
  it('adds the page name as a query', () => {
    expect(comingSoonPath('Blog')).toBe('/coming-soon?page=Blog');
    expect(comingSoonPath('Help-Center')).toBe('/coming-soon?page=Help-Center');
  });
});

describe('settingsDeleteAccountPath', () => {
  it('builds the settings URL that opens the delete-account modal', () => {
    expect(settingsDeleteAccountPath()).toBe('/settings?action=delete');
  });

  it('uses the same query the settings page reads', () => {
    const params = new URL(settingsDeleteAccountPath(), 'https://example.com').searchParams;
    expect(params.get(SETTINGS_DELETE_ACCOUNT_QUERY.key)).toBe(SETTINGS_DELETE_ACCOUNT_QUERY.value);
  });
});

describe('profile paths', () => {
  it('builds the profile path', () => {
    expect(profilePath('alice')).toBe('/alice');
  });

  it('omits the query for the default posts tab', () => {
    expect(profileTabPath('alice', 'posts')).toBe('/alice');
  });

  it('adds the tab query for non-default tabs', () => {
    expect(profileTabPath('alice', 'replies')).toBe('/alice?tab=replies');
    expect(profileTabPath('alice', 'likes')).toBe('/alice?tab=likes');
  });

  it('builds followers and following paths', () => {
    expect(followersPath('alice')).toBe('/alice/followers');
    expect(followersPath('alice', 'followers')).toBe('/alice/followers');
    expect(followersPath('alice', 'following')).toBe('/alice/followers?tab=following');
  });
});

describe('postPath', () => {
  it('builds the post detail path', () => {
    expect(postPath('alice', 'post-1')).toBe('/alice/posts/post-1');
  });

  it('adds the comment anchor when a comment id is given', () => {
    expect(postPath('alice', 'post-1', 'c9')).toBe('/alice/posts/post-1#comment-c9');
  });

  it('ignores an empty comment id', () => {
    expect(postPath('alice', 'post-1', '')).toBe('/alice/posts/post-1');
  });
});

describe('tickerPath', () => {
  it('builds the ticker detail path', () => {
    expect(tickerPath('BTC')).toBe('/ticker/BTC');
  });
});

describe('auth error codes', () => {
  it('builds landing URLs with an error code', () => {
    expect(landingWithError(AUTH_ERROR_CODES.auth)).toBe('/?error=auth');
    expect(landingWithError(AUTH_ERROR_CODES.resetExpired)).toBe('/?error=reset_expired');
  });

  it('recognises only known error codes', () => {
    expect(isAuthErrorCode('auth')).toBe(true);
    expect(isAuthErrorCode('reset_expired')).toBe(true);
    expect(isAuthErrorCode('constructor')).toBe(false);
    expect(isAuthErrorCode('unknown')).toBe(false);
    expect(isAuthErrorCode(null)).toBe(false);
    expect(isAuthErrorCode(undefined)).toBe(false);
  });
});

describe('getAnalyticsPath re-export', () => {
  it('is the same helper as the analytics module', () => {
    expect(getAnalyticsPath()).toBe('/analytics');
    expect(getAnalyticsPath('alice', 'predictions')).toBe('/analytics/alice?tab=predictions');
  });
});
