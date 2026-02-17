import { apiGet, apiPost, apiDelete } from '@/lib/api/client';

export interface FilteredUserItem {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string | null;
  muted_at?: string | null;
  blocked_at?: string | null;
}

export interface ContentFiltersResponse {
  muted_users: FilteredUserItem[];
  blocked_users: FilteredUserItem[];
}

export interface ContentFiltersListResponse {
  data: ContentFiltersResponse;
}

export interface MuteResponse {
  muted: boolean;
}

export interface BlockResponse {
  blocked: boolean;
}

export async function listContentFilters(
  accessToken: string
): Promise<ContentFiltersResponse> {
  const res = await apiGet<ContentFiltersListResponse>('/content-filters', accessToken);
  return res.data;
}

export async function muteUserApi(
  userId: string,
  accessToken: string
): Promise<MuteResponse> {
  const res = await apiPost<{ data: MuteResponse }>(
    `/users/${userId}/mute`,
    {},
    accessToken
  );
  return res.data;
}

export async function unmuteUserApi(
  userId: string,
  accessToken: string
): Promise<void> {
  await apiDelete(`/users/${userId}/mute`, accessToken);
}

export async function blockUserApi(
  userId: string,
  accessToken: string
): Promise<BlockResponse> {
  const res = await apiPost<{ data: BlockResponse }>(
    `/users/${userId}/block`,
    {},
    accessToken
  );
  return res.data;
}

export async function unblockUserApi(
  userId: string,
  accessToken: string
): Promise<void> {
  await apiDelete(`/users/${userId}/block`, accessToken);
}
