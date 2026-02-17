/**
 * Post API: create, list, and map backend responses to frontend Post type.
 */
import { Post, User } from '@/types';
import { formatRelativeTime } from '@/utils/core/dateUtils';
import { apiDelete, apiGet, apiPost, apiUploadMedia } from './client';

export interface PollInResponse {
  poll_id: string;
  options: string[];
  results: Record<number, number>;
  total_votes: number;
  user_vote?: number | null;
  is_finished: boolean;
  expires_at: string;
}

export interface OriginalPostInResponse {
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

export interface PostInFeedResponse {
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
  stats: { likes: number; comments: number; reposts: number };
  user_interactions: { liked: boolean; reposted: boolean };
  tickers?: { symbol: string; name?: string | null }[];
  created_at: string;
  poll?: PollInResponse | null;
  original_post_id?: string | null;
  repost_type?: string | null;
  original_post?: OriginalPostInResponse | null;
}

export interface PostResponse {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[] | null;
  gif_url?: string | null;
  stats: { likes: number; comments: number; reposts: number };
  user_interactions: { liked: boolean; reposted: boolean };
  tickers?: { symbol: string; name?: string | null }[];
  created_at: string;
  poll?: PollInResponse | null;
}

export interface CreatePostPayload {
  content: string;
  media_urls?: string[];
  gif_url?: string;
  poll?: { options: string[]; duration_days: number };
}

export interface ListPostsResponse {
  data: PostInFeedResponse[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TogglePostReactionResponse {
  reacted: boolean;
  reaction_count: number;
}

/**
 * Map backend PostInFeedResponse or PostResponse to frontend Post.
 * When author is in the response (PostInFeedResponse), use it; otherwise pass author from currentUser.
 * pollOverride: use when backend response doesn't include poll (e.g. create response).
 */
export function mapPostResponseToPost(
  res: PostInFeedResponse | PostResponse,
  authorOverride?: User,
  pollOverride?: { options: string[]; duration: number }
): Post {
  const author: User = 'author' in res
    ? {
        id: res.author.id,
        displayName: res.author.display_name,
        handle: res.author.username,
        avatar: res.author.profile_picture_url ?? '',
        badge: res.author.badge === 'Verified' ? 'Verified' : res.author.badge === 'Public' ? 'Public' : undefined,
      } as User
    : authorOverride!;

  const raw = res as unknown as Record<string, unknown>;
  const content = typeof raw.content === 'string' ? raw.content : (res.content ?? '');
  const mediaUrls = raw.media_urls ?? res.media_urls;
  const post: Post = {
    id: res.id,
    author,
    content,
    createdAt: formatRelativeTime(new Date(res.created_at)),
    createdAtRaw: res.created_at,
    media: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : undefined,
    gifUrl: typeof raw.gif_url === 'string' ? raw.gif_url : (res.gif_url ?? undefined),
    stats: {
      likes: res.stats.likes,
      comments: res.stats.comments,
      reposts: res.stats.reposts,
    },
    userInteractions: {
      liked: res.user_interactions.liked,
      reposted: res.user_interactions.reposted,
    },
  };

  const repostTypeRaw = raw.repost_type ?? raw.repostType;
  const originalPostIdRaw = raw.original_post_id ?? raw.originalPostId;
  if (repostTypeRaw === 'normal' || repostTypeRaw === 'quote') {
    post.repostType = repostTypeRaw as 'normal' | 'quote';
  }
  if (originalPostIdRaw != null && typeof originalPostIdRaw === 'string') {
    post.originalPostId = originalPostIdRaw;
    if (!post.repostType) post.repostType = 'quote';
  }

  const originalPostRaw = raw.original_post ?? (res as PostInFeedResponse).original_post;
  if (originalPostRaw && typeof originalPostRaw === 'object' && 'id' in originalPostRaw && 'author' in originalPostRaw) {
    const op = originalPostRaw as OriginalPostInResponse;
    post.quotedPost = {
      id: op.id,
      author: {
        id: op.author.id,
        displayName: op.author.display_name,
        handle: op.author.username,
        avatar: op.author.profile_picture_url ?? '',
        badge: op.author.badge === 'Verified' ? 'Verified' : op.author.badge === 'Public' ? 'Public' : undefined,
      },
      content: op.content,
      createdAt: formatRelativeTime(new Date(op.created_at)),
      createdAtRaw: op.created_at,
      media: Array.isArray(op.media_urls) && op.media_urls.length > 0 ? op.media_urls : undefined,
      gifUrl: op.gif_url ?? undefined,
      stats: { likes: 0, comments: 0, reposts: 0 },
      userInteractions: { liked: false, reposted: false },
    } as Post;
  }

  if (res.poll) {
    post.poll = {
      pollId: res.poll.poll_id,
      options: res.poll.options,
      duration: 1,
      createdAt: formatRelativeTime(new Date(res.created_at)),
      votes: res.poll.results ?? {},
      userVote: res.poll.user_vote ?? undefined,
      isFinished: res.poll.is_finished,
      expiresAt: res.poll.expires_at,
    };
  } else if (pollOverride && pollOverride.options.length >= 2) {
    post.poll = {
      options: pollOverride.options,
      duration: pollOverride.duration,
      createdAt: formatRelativeTime(new Date(res.created_at)),
      votes: {},
      userVote: undefined,
      isFinished: false,
    };
  }

  return post;
}

/**
 * Create a post. Uploads media first if provided.
 */
export async function createPost(
  payload: CreatePostPayload,
  mediaFiles: File[] | undefined,
  accessToken: string
): Promise<PostResponse> {
  let mediaUrls: string[] | undefined;

  if (mediaFiles && mediaFiles.length > 0) {
    const { uploads } = await apiUploadMedia(mediaFiles, accessToken);
    mediaUrls = uploads.map((u) => u.url);
  }

  const body: CreatePostPayload = {
    content: payload.content,
    media_urls: mediaUrls ?? payload.media_urls,
    gif_url: payload.gif_url,
    poll: payload.poll,
  };

  return apiPost<PostResponse>('/posts', body, accessToken);
}

/**
 * Delete a post. Only the owner can delete.
 */
export async function deletePost(postId: string, accessToken: string): Promise<void> {
  await apiDelete(`/posts/${postId}`, accessToken);
}

/**
 * Toggle like on a post.
 */
export async function togglePostReaction(
  postId: string,
  accessToken: string
): Promise<TogglePostReactionResponse> {
  return apiPost<TogglePostReactionResponse>(`/posts/${postId}/reactions`, {}, accessToken);
}

export interface VotePollResponse {
  data: { voted: boolean; option_index: number; results: Record<number, number>; total_votes: number };
}

/**
 * Vote on a poll. Returns updated results.
 */
export async function votePoll(
  pollId: string,
  optionIndex: number,
  accessToken: string
): Promise<VotePollResponse> {
  return apiPost<VotePollResponse>(`/polls/${pollId}/votes`, { option_index: optionIndex }, accessToken);
}

/**
 * Get home feed from backend. Auth required. Excludes muted/blocked users.
 */
export async function listFeed(
  accessToken: string,
  params?: { page?: number; per_page?: number }
): Promise<ListPostsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const query = search.toString();
  const path = `/feed${query ? `?${query}` : ''}`;
  return apiGet<ListPostsResponse>(path, accessToken);
}

/**
 * List posts from backend (filtered by user_id or ticker). Use listFeed for home feed.
 */
export async function listPosts(
  accessToken: string | null,
  params?: { page?: number; per_page?: number; user_id?: string; ticker?: string }
): Promise<ListPostsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  if (params?.user_id) search.set('user_id', params.user_id);
  if (params?.ticker) search.set('ticker', params.ticker);
  const query = search.toString();
  const path = `/posts${query ? `?${query}` : ''}`;
  return apiGet<ListPostsResponse>(path, accessToken);
}

/**
 * Get a single post by ID. Public (no auth required) for shared links.
 * Returns feed-style response with author so unauthenticated users can view the post.
 */
export async function getPostById(
  postId: string,
  accessToken?: string | null
): Promise<PostInFeedResponse> {
  return apiGet<PostInFeedResponse>(`/posts/${postId}`, accessToken);
}

/** Repost API (backend is source of truth). */
export interface CreateRepostPayload {
  type: 'normal' | 'quote';
  quote_content?: string;
  media_urls?: string[];
  gif_url?: string;
}

export interface RepostResponse {
  id: string;
  type: string;
  original_post: { id: string; author: { username: string; display_name: string }; content: string };
  quote_content?: string | null;
  created_at: string;
  quote_post?: PostInFeedResponse | null;
}

export async function createRepost(
  postId: string,
  body: CreateRepostPayload,
  accessToken: string
): Promise<RepostResponse> {
  return apiPost<RepostResponse>(`/posts/${postId}/reposts`, body, accessToken);
}

export async function deleteRepost(postId: string, accessToken: string): Promise<void> {
  await apiDelete(`/posts/${postId}/reposts`, accessToken);
}
