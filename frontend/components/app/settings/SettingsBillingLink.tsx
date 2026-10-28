'use client';

import Link from 'next/link';
import { ChevronRight, CreditCard } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getBillingRowSubtitle } from '@/utils/billing/billingRowSubtitle';

/** Row linking from Settings to Billing & subscription. */
export default function SettingsBillingLink() {
  const { billingStatus } = useSubscription();

  return (
    <div className="px-2 pt-4 lg:px-4">
      <Link
        href={ROUTES.billing}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-colors hover:bg-white/[0.07]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <CreditCard className="h-5 w-5 shrink-0 text-cyan-400" aria-hidden />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-white">
              Billing &amp; subscription
            </span>
            <span className="block truncate text-xs text-gray-400">
              {getBillingRowSubtitle(billingStatus)}
            </span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
      </Link>
    </div>
  );
}
