'use client';

import type { User } from '@/types';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';

interface AuthorBadgesProps {
  subscriptionPlanId?: User['subscriptionPlanId'];
  size?: 'sm' | 'md';
  className?: string;
}

export default function AuthorBadges({
  subscriptionPlanId,
  size = 'sm',
  className = '',
}: AuthorBadgesProps) {
  if (!subscriptionPlanId) {
    return null;
  }

  const tickSize = size === 'md' ? 18 : 14;
  const planLabel = subscriptionPlanId === 'investor' ? 'Investor' : 'Analyst';

  return (
    <VerifiedTickIcon
      variant={subscriptionPlanId}
      size={tickSize}
      className={className}
      title={`${planLabel} subscriber`}
    />
  );
}
