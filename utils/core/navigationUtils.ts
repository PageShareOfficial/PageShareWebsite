/**
 * Navigation utility functions
 * Centralized navigation helpers for consistent routing across the app
 */

/**
 * Navigate to a user's profile page
 * @param handle - User's handle/username
 * @param router - Next.js router instance from useRouter()
 */
export function navigateToProfile(handle: string, router: { push: (path: string) => void }): void {
  if (!handle) return;
  router.push(`/${handle}`);
}

/**
 * Navigate to a ticker detail page
 * @param ticker - Ticker symbol
 * @param router - Next.js router instance from useRouter()
 */
export function navigateToTicker(ticker: string, router: { push: (path: string) => void }): void {
  if (!ticker) return;
  router.push(`/ticker/${ticker}`);
}

/**
 * Navigate to a post detail page
 * @param username - Post author's username
 * @param postId - Post ID
 * @param router - Next.js router instance from useRouter()
 */
export function navigateToPost(
  username: string,
  postId: string,
  router: { push: (path: string) => void }
): void {
  if (!username || !postId) return;
  router.push(`/${username}/posts/${postId}`);
}
