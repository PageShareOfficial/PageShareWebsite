/**
 * User profile API: fetch by username, update profile, follow/unfollow.
 */
import { apiFetch, apiPatch } from './client';
import type { PostInFeedResponse } from './postApi';

export interface ProfileByUsernameResponse {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  profile_picture_url?: string | null;
  badge?: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following?: boolean | null;
  interests: string[];
  created_at: string;
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  interests?: string[];
}

/**
 * Fetch public profile by username. No auth required.
 * Returns null when user is not found (404).
 */
export async function getProfileByUsername(
  username: string,
  accessToken?: string | null
): Promise<ProfileByUsernameResponse | null> {
  const path = `/users/by-username/${encodeURIComponent(username)}`;
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      const msg = json.error?.message ?? json.detail ?? text;
      throw new Error(typeof msg === 'string' ? msg : `Request failed: ${res.status}`);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }
  return res.json() as Promise<ProfileByUsernameResponse>;
}

/**
 * Update current user profile (display_name, bio, interests).
 */
export async function updateProfile(
  payload: UpdateProfilePayload,
  accessToken: string
): Promise<{ id: string; username: string; display_name: string; bio?: string | null; profile_picture_url?: string | null; interests: string[] }> {
  const body: Record<string, unknown> = {};
  if (payload.display_name !== undefined) body.display_name = payload.display_name;
  if (payload.bio !== undefined) body.bio = payload.bio;
  if (payload.interests !== undefined) body.interests = payload.interests;
  return apiPatch('/users/me', body, accessToken);
}

/** Follow a user. Returns updated follower_count. */
export async function followUserApi(
  userId: string,
  accessToken: string
): Promise<{ data: { following: boolean; follower_count: number } }> {
  const res = await apiFetch(`/users/${userId}/follow`, {
    method: 'POST',
    accessToken,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || text || 'Follow failed');
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(text);
    }
  }
  return res.json();
}

/** Unfollow a user. Returns updated follower_count. */
export async function unfollowUserApi(
  userId: string,
  accessToken: string
): Promise<{ data: { following: boolean; follower_count: number } }> {
  const res = await apiFetch(`/users/${userId}/follow`, {
    method: 'DELETE',
    accessToken,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.detail || text || 'Unfollow failed');
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error(text);
    }
  }
  return res.json();
}

export interface FollowerFollowingItem {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string | null;
  is_following: boolean;
  followed_at: string;
}

export interface ListFollowersFollowingResponse {
  data: FollowerFollowingItem[];
  pagination: { page: number; per_page: number; total: number };
}

/** List a user's followers (paginated). */
export async function listFollowersApi(
  userId: string,
  accessToken: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListFollowersFollowingResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const q = search.toString();
  const path = `/users/${userId}/followers${q ? `?${q}` : ''}`;
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error('User not found');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** List users that a user follows (paginated). */
export async function listFollowingApi(
  userId: string,
  accessToken: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListFollowersFollowingResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const q = search.toString();
  const path = `/users/${userId}/following${q ? `?${q}` : ''}`;
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error('User not found');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Backend poll shape (post or comment). */
export interface PollInReplyResponse {
  poll_id: string;
  options: string[];
  results: Record<number, number>;
  total_votes: number;
  user_vote?: number | null;
  is_finished: boolean;
  expires_at: string;
}

/** Original post embedded in a quote repost (from replies API). */
export interface OriginalPostInReplyResponse {
  id: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url?: string | null;
    badge?: string | null;
  };
  content: string;
  media_urls?: string[] | null;
  gif_url?: string | null;
  created_at: string;
}

/** User replies (comments written by this user). */
export interface UserReplyItem {
  comment: {
    id: string;
    post_id: string;
    author: {
      id: string;
      username: string;
      display_name: string;
      profile_picture_url?: string | null;
      badge?: string | null;
    };
    content: string;
    media_urls?: string[] | null;
    gif_url?: string | null;
    likes: number;
    user_liked: boolean;
    created_at: string;
    poll?: PollInReplyResponse | null;
  };
  post: {
    id: string;
    content: string;
    media_urls?: string[] | null;
    gif_url?: string | null;
    author: {
      id: string;
      username: string;
      display_name: string;
      profile_picture_url?: string | null;
      badge?: string | null;
    };
    created_at?: string | null;
    poll?: PollInReplyResponse | null;
    original_post_id?: string | null;
    repost_type?: string | null;
    original_post?: OriginalPostInReplyResponse | null;
  };
}

export interface ListUserRepliesResponse {
  data: UserReplyItem[];
  pagination: { page: number; per_page: number; total: number; has_next: boolean };
}

export async function listUserReplies(
  userId: string,
  accessToken: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListUserRepliesResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const q = search.toString();
  const path = `/users/${userId}/replies${q ? `?${q}` : ''}`;
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error('User not found');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** User likes (posts liked by this user). Same data shape as feed/post list. */
export interface ListUserLikesResponse {
  data: PostInFeedResponse[];
  pagination: { page: number; per_page: number; total: number; has_next: boolean };
}

export async function listUserLikes(
  userId: string,
  accessToken: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListUserLikesResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const q = search.toString();
  const path = `/users/${userId}/likes${q ? `?${q}` : ''}`;
  const res = await apiFetch(path, { method: 'GET', accessToken });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new Error('User not found');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}
