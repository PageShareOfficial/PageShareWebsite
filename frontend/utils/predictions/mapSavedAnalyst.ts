import type { SavedAnalystApiItem } from '@/lib/api/savedAnalystApi';
import type { SavedAnalyst } from '@/types/savedAnalyst';
import type { PlanId } from '@/types/billing';

export function mapSavedAnalystFromApi(item: SavedAnalystApiItem): SavedAnalyst {
  return {
    id: item.id,
    handle: item.handle,
    displayName: item.display_name,
    avatar: item.avatar,
    subscriptionPlanId: (item.subscription_plan_id ?? undefined) as PlanId | undefined,
  };
}
