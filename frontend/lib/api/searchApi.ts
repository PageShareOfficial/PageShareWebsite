/**
 * Backend search (users/tickers) and recent searches API.
 * Source of truth: backend.
 */
import { apiGet, apiPost, apiDelete } from './client';
import type { User } from '@/types';

/** Backend search response for users (GET /search?type=users). */
export interface SearchUsersResponse {
  data: {
    users: Array<{
      id: string;
      username: string;
      display_name: string;
      profile_picture_url?: string | null;
    }>;
    tickers: unknown[];
  };
  pagination: { page: number; per_page: number; total: number };
}

/** Map backend search user item to frontend User. */
function toUser(item: SearchUsersResponse['data']['users'][0]): User {
  return {
    id: item.id,
    handle: item.username,
    displayName: item.display_name,
    avatar: item.profile_picture_url ?? '',
  };
}

/**
 * Search users via backend. Use this for Discover account search (source of truth).
 */
export async function searchUsersBackend(
  query: string,
  limit: number = 20,
  accessToken?: string | null
): Promise<User[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  const res = await apiGet<SearchUsersResponse>(
    `/search?q=${q}&type=users&page=1&per_page=${Math.min(limit, 50)}`,
    accessToken ?? undefined
  );
  return (res.data?.users ?? []).map(toUser);
}

/** Recent search item from backend (GET /users/me/recent-searches). */
export interface RecentSearchItem {
  id: string;
  type: 'account' | 'ticker';
  result_id: string;
  query: string;
  result_display_name?: string | null;
  result_image_url?: string | null;
  created_at: string;
}

export interface RecentSearchesListResponse {
  data: RecentSearchItem[];
}

/** Body for POST /users/me/recent-searches. */
export interface RecentSearchCreateBody {
  type: 'account' | 'ticker';
  result_id: string;
  query: string;
  result_display_name?: string | null;
  result_image_url?: string | null;
}

/**
 * Get current user's recent searches. Requires auth.
 */
export async function getRecentSearchesBackend(
  accessToken: string,
  limit: number = 20
): Promise<RecentSearchItem[]> {
  const res = await apiGet<RecentSearchesListResponse>(
    `/users/me/recent-searches?limit=${limit}`,
    accessToken
  );
  return res.data ?? [];
}

/**
 * Add a recent search. Requires auth.
 */
export async function addRecentSearchBackend(
  body: RecentSearchCreateBody,
  accessToken: string
): Promise<RecentSearchItem> {
  const res = await apiPost<{ data: RecentSearchItem }>(
    '/users/me/recent-searches',
    body,
    accessToken
  );
  return res.data;
}

/**
 * Clear all recent searches for current user. Requires auth.
 */
export async function clearRecentSearchesBackend(accessToken: string): Promise<void> {
  await apiDelete('/users/me/recent-searches', accessToken);
}

/**
 * Remove one recent search by id. Requires auth.
 */
export async function removeRecentSearchBackend(
  searchId: string,
  accessToken: string
): Promise<void> {
  await apiDelete(`/users/me/recent-searches/${searchId}`, accessToken);
}
