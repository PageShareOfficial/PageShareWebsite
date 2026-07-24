/**
 * Saved analysts API (investor bookmarks).
 */
import { apiDelete, apiGet, apiPost } from './client';
import type { PlanId } from '@/types/billing';

export interface SavedAnalystApiItem {
  id: string;
  handle: string;
  display_name: string;
  avatar: string;
  subscription_plan_id?: PlanId | null;
  saved_at: string;
}

export interface ListSavedAnalystsResponse {
  data: SavedAnalystApiItem[];
  pagination: { page: number; per_page: number; total: number; has_next?: boolean };
}

const LIST_PAGE_SIZE = 100;

export async function listSavedAnalysts(
  accessToken: string,
  params?: { page?: number; per_page?: number }
): Promise<ListSavedAnalystsResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  search.set('per_page', String(params?.per_page ?? LIST_PAGE_SIZE));
  const qs = search.toString();
  return apiGet<ListSavedAnalystsResponse>(`/saved-analysts?${qs}`, accessToken);
}

export async function saveAnalystByUsername(
  username: string,
  accessToken: string
): Promise<SavedAnalystApiItem> {
  const res = await apiPost<{ data: SavedAnalystApiItem }>(
    `/saved-analysts/${encodeURIComponent(username)}`,
    undefined,
    accessToken
  );
  return res.data;
}

export async function unsaveAnalystByUsername(
  username: string,
  accessToken: string
): Promise<void> {
  await apiDelete(`/saved-analysts/${encodeURIComponent(username)}`, accessToken);
}
