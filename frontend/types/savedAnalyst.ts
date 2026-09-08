import type { PlanId } from '@/types/billing';

export interface SavedAnalyst {
  id: string;
  handle: string;
  displayName: string;
  avatar: string;
  subscriptionPlanId?: PlanId;
}
