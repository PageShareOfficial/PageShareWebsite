/**
 * Single source of truth for app paths used in navigation.
 * Components build URLs from here instead of typing path strings inline.
 * Route segment sets used by middleware live in '@/utils/core/routeConstants'.
 *
 * Handles, post ids and ticker symbols are inserted as-is: they are URL-safe by
 * construction, and the pages reading them expect the raw (un-encoded) value.
 */

export {
  getAnalyticsPath,
  type AnalyticsPathOptions,
  type AnalyticsTabId,
} from '@/utils/predictions/analyticsRoutes';

export const ROUTES = {
  landing: '/',
  home: '/home',
  predictions: '/predictions',
  submitPrediction: '/submit-prediction',
  settings: '/settings',
  billing: '/settings/billing',
  onboarding: '/onboarding',
  plans: '/plans',
  myAnalysts: '/myanalysts',
  discover: '/discover',
  labs: '/labs',
  watchlist: '/watchlist',
  bookmarks: '/bookmarks',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  disclaimer: '/disclaimer',
  comingSoon: '/coming-soon',
} as const;

/** Placeholder pages linked from the landing footer; the coming-soon page shows the name. */
export type ComingSoonPage =
  | 'Help-Center'
  | 'Accessibility'
  | 'Blog'
  | 'Careers'
  | 'Brand-Resources'
  | 'API'
  | 'Contact';

/** Query the settings page reads to open the delete-account modal on arrival. */
export const SETTINGS_DELETE_ACCOUNT_QUERY = {
  key: 'action',
  value: 'delete',
} as const;

export type ProfileTab = 'posts' | 'replies' | 'likes';
export type FollowListTab = 'followers' | 'following';

/** Error codes the landing page understands via `/?error=<code>`. */
export const AUTH_ERROR_CODES = {
  auth: 'auth',
  resetExpired: 'reset_expired',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

const AUTH_ERROR_CODE_VALUES: ReadonlySet<string> = new Set(Object.values(AUTH_ERROR_CODES));

export function isAuthErrorCode(value: string | null | undefined): value is AuthErrorCode {
  return typeof value === 'string' && AUTH_ERROR_CODE_VALUES.has(value);
}

export function profilePath(handle: string): string {
  return `/${handle}`;
}

/** The default `posts` tab has no query so the canonical profile URL stays clean. */
export function profileTabPath(handle: string, tab: ProfileTab): string {
  return tab === 'posts' ? profilePath(handle) : `${profilePath(handle)}?tab=${tab}`;
}

export function followersPath(handle: string, tab: FollowListTab = 'followers'): string {
  const base = `${profilePath(handle)}/followers`;
  return tab === 'following' ? `${base}?tab=following` : base;
}

export function postPath(handle: string, postId: string, commentId?: string): string {
  const base = `${profilePath(handle)}/posts/${postId}`;
  return commentId ? `${base}#comment-${commentId}` : base;
}

export function tickerPath(symbol: string): string {
  return `/ticker/${symbol}`;
}

export function landingWithError(code: AuthErrorCode): string {
  return `${ROUTES.landing}?error=${code}`;
}

export function comingSoonPath(page: ComingSoonPage): string {
  return `${ROUTES.comingSoon}?page=${page}`;
}

export function settingsDeleteAccountPath(): string {
  const { key, value } = SETTINGS_DELETE_ACCOUNT_QUERY;
  return `${ROUTES.settings}?${key}=${value}`;
}
