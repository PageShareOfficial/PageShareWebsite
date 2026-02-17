/**
 * Bookmark API: add, remove, list.
 */

import { apiDelete, apiGet, apiPost } from './client';

export interface BookmarkedPostItem {
  id: string;
  author: { username: string; display_name: string; profile_picture_url?: string | null };
  content: string;
  created_at: string;
  bookmarked_at: string;
}

export interface ListBookmarksResponse {
  data: BookmarkedPostItem[];
  pagination: { page: number; per_page: number; total: number };
}

/**
 * Add a post to bookmarks.
 */
export async function addBookmark(postId: string, accessToken: string): Promise<{ data: { bookmarked: boolean } }> {
  return apiPost<{ data: { bookmarked: boolean } }>(
    `/posts/${postId}/bookmarks`,
    undefined,
    accessToken
  );
}

/**
 * Remove a post from bookmarks.
 */
export async function removeBookmark(postId: string, accessToken: string): Promise<void> {
  await apiDelete(`/posts/${postId}/bookmarks`, accessToken);
}

/**
 * List user's bookmarked posts.
 */
export async function listBookmarks(
  accessToken: string,
  params?: { page?: number; per_page?: number }
): Promise<ListBookmarksResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const query = search.toString();
  const path = `/bookmarks${query ? `?${query}` : ''}`;
  return apiGet<ListBookmarksResponse>(path, accessToken);
}
