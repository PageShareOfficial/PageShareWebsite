/**
 * Comment API: create, list, delete, like (reactions) for comments.
 */

import { apiDelete, apiGet, apiPost, apiUploadMedia } from './client';
import type { PollInResponse } from './postApi';

export interface CommentAuthorResponse {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string | null;
}

export interface CommentResponse {
  id: string;
  post_id: string;
  author: CommentAuthorResponse;
  content: string;
  media_urls?: string[] | null;
  gif_url?: string | null;
  likes: number;
  user_liked: boolean;
  created_at: string;
  poll?: PollInResponse | null;
}

export interface ListCommentsResponse {
  data: CommentResponse[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    has_next: boolean;
  };
}

export interface CreateCommentPayload {
  content: string;
  media_urls?: string[];
  gif_url?: string;
  poll?: { options: string[]; duration_days: number };
}

/**
 * List comments for a post (paginated).
 */
export async function listComments(
  postId: string,
  accessToken: string | null,
  params?: { page?: number; per_page?: number }
): Promise<ListCommentsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.per_page) search.set('per_page', String(params.per_page));
  const query = search.toString();
  const path = `/posts/${postId}/comments${query ? `?${query}` : ''}`;
  return apiGet<ListCommentsResponse>(path, accessToken);
}

/**
 * Create a comment on a post. Uploads media first if provided.
 */
export async function createComment(
  postId: string,
  payload: CreateCommentPayload,
  mediaFiles: File[] | undefined,
  accessToken: string
): Promise<CommentResponse> {
  let mediaUrls: string[] | undefined;

  if (mediaFiles && mediaFiles.length > 0) {
    const { uploads } = await apiUploadMedia(mediaFiles, accessToken);
    mediaUrls = uploads.map((u) => u.url);
  }

  const body: CreateCommentPayload = {
    content: payload.content,
    media_urls: mediaUrls ?? payload.media_urls,
    gif_url: payload.gif_url,
    poll: payload.poll,
  };

  return apiPost<CommentResponse>(`/posts/${postId}/comments`, body, accessToken);
}

/**
 * Delete a comment. Only the author can delete.
 */
export async function deleteComment(commentId: string, accessToken: string): Promise<void> {
  await apiDelete(`/comments/${commentId}`, accessToken);
}

export interface ToggleCommentReactionResponse {
  reacted: boolean;
  reaction_count: number;
}

/**
 * Toggle like on a comment.
 */
export async function toggleCommentReaction(
  commentId: string,
  accessToken: string
): Promise<ToggleCommentReactionResponse> {
  return apiPost<ToggleCommentReactionResponse>(`/comments/${commentId}/reactions`, {}, accessToken);
}
