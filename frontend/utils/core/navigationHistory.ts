/**
 * Tracks whether the current tab has an earlier PageShare page to go back to.
 *
 * `window.history.length` can't answer this: it also counts other sites visited in the
 * same tab. The Navigation API's `canGoBack` only considers same-origin entries, so it is
 * used when the browser supports it. Otherwise an in-memory depth counter is used:
 * pathname changes count as forward navigation, popstate-driven ones as going back.
 */

interface NavigationApi {
  canGoBack: boolean;
}

let inAppDepth = 0;
let lastPathname: string | null = null;
let isPopNavigationPending = false;

export function getBrowserNavigationApi(): NavigationApi | null {
  if (typeof window === 'undefined') return null;
  const navigation = (window as Window & { navigation?: Partial<NavigationApi> }).navigation;
  return typeof navigation?.canGoBack === 'boolean' ? (navigation as NavigationApi) : null;
}

/** Call on every pathname change (including the first page load). */
export function recordPathnameChange(pathname: string): void {
  if (lastPathname === null) {
    lastPathname = pathname;
    return;
  }
  if (pathname === lastPathname) return;
  lastPathname = pathname;

  if (isPopNavigationPending) {
    isPopNavigationPending = false;
    inAppDepth = Math.max(0, inAppDepth - 1);
    return;
  }
  inAppDepth += 1;
}

/** Call from a `popstate` listener; the next pathname change is treated as going back. */
export function recordPopNavigation(): void {
  isPopNavigationPending = true;
}

export function canGoBackInApp(
  navigationApi: NavigationApi | null = getBrowserNavigationApi()
): boolean {
  if (navigationApi) return navigationApi.canGoBack;
  return inAppDepth > 0;
}

/** Test helper: clears tracked history between tests. */
export function resetNavigationHistory(): void {
  inAppDepth = 0;
  lastPathname = null;
  isPopNavigationPending = false;
}
