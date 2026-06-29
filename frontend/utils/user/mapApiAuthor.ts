import type { User } from '@/types';
import type { PlanId } from '@/types/billing';

export interface ApiAuthorFields {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string | null;
  subscription_plan_id?: string | null;
}

export function parseSubscriptionPlanId(
  planId?: string | null
): PlanId | undefined {
  if (planId === 'analyst' || planId === 'investor') {
    return planId;
  }
  return undefined;
}

export function mapApiAuthorToUser(author: ApiAuthorFields): User {
  return {
    id: author.id,
    displayName: author.display_name,
    handle: author.username,
    avatar: author.profile_picture_url ?? '',
    subscriptionPlanId: parseSubscriptionPlanId(author.subscription_plan_id),
  };
}
