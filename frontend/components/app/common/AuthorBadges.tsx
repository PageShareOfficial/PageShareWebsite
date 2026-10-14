'use client';

import type { User } from '@/types';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import type { VerifiedTickVariant } from '@/constants/verifiedTick';

interface AuthorBadgesProps {
  subscriptionPlanId?: User['subscriptionPlanId'];
  isAdmin?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const TICK_TITLES: Record<VerifiedTickVariant, string> = {
  admin: 'PageShare admin',
  investor: 'Investor subscriber',
  analyst: 'Analyst subscriber',
};

/** Admin tick wins over plan ticks so staff accounts are always recognisable. */
export function resolveTickVariant(
  subscriptionPlanId: User['subscriptionPlanId'],
  isAdmin: boolean | undefined
): VerifiedTickVariant | null {
  if (isAdmin) return 'admin';
  return subscriptionPlanId ?? null;
}

export default function AuthorBadges({
  subscriptionPlanId,
  isAdmin,
  size = 'sm',
  className = '',
}: AuthorBadgesProps) {
  const variant = resolveTickVariant(subscriptionPlanId, isAdmin);
  if (!variant) {
    return null;
  }

  return (
    <VerifiedTickIcon
      variant={variant}
      size={size === 'md' ? 18 : 14}
      className={className}
      title={TICK_TITLES[variant]}
    />
  );
}
