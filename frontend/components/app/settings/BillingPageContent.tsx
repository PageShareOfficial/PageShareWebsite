'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, CreditCard, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import Topbar from '@/components/app/layout/Topbar';
import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import { PLANS } from '@/components/app/plans/planData';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { createPortalSession } from '@/lib/api/billingApi';
import type { PlanId } from '@/types/billing';
import { formatDate } from '@/utils/core/dateUtils';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  none: 'Free',
};

const PLAN_ACCENT: Record<PlanId, { border: string; badge: string; text: string }> = {
  analyst: {
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    text: 'text-blue-400',
  },
  investor: {
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
  },
};

function getPlanDetails(planId: PlanId | null | undefined) {
  if (!planId) return null;
  return PLANS.find((plan) => plan.id === planId) ?? null;
}

export default function BillingPageContent() {
  const { session } = useAuth();
  const { billingStatus, isPremium, isLoading, refreshBillingStatus } =
    useSubscription();
  const { openPremium } = usePremiumOverlay();
  const isOnline = useOnlineStatus();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = getPlanDetails(billingStatus?.plan_id ?? null);
  const accent = billingStatus?.plan_id
    ? PLAN_ACCENT[billingStatus.plan_id]
    : null;

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const handleManageBilling = useCallback(async () => {
    setError(null);

    if (!isOnline) {
      setError('You are offline. Connect to the internet to manage billing.');
      return;
    }

    const accessToken = session?.access_token;
    if (!accessToken) {
      setError('Sign in again to manage billing.');
      return;
    }

    setPortalLoading(true);
    try {
      const { url } = await createPortalSession(accessToken);
      window.open(url, '_blank', 'noopener,noreferrer');
      setPortalLoading(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not open billing portal. Please try again.'));
      setPortalLoading(false);
    }
  }, [isOnline, session?.access_token]);

  const renewalLabel = billingStatus?.current_period_end
    ? formatDate(billingStatus.current_period_end)
    : null;

  return (
    <>
      <Topbar />

      <div className="hidden md:flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <Link
          href="/settings"
          className="p-2 -ml-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Back to settings"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-white">Billing</h1>
      </div>

      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-4 lg:px-4">
          <Link
            href="/settings"
            className="md:hidden inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Settings
          </Link>

          <div className="mb-6">
            <h1 className="md:hidden text-xl font-bold text-white mb-1">Billing</h1>
            <p className="text-sm text-gray-400">
              View your plan, renewal date, and manage payments through Stripe
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Loading subscription details...
              </div>
            ) : isPremium && plan && accent ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <VerifiedTickIcon variant={plan.id} size={28} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
                        {plan.tickLabel}
                      </p>
                      <h2 className="text-base font-bold text-white">{plan.roleTitle}</h2>
                      <p className="text-sm text-gray-400 mt-0.5">
                        Billed{' '}
                        {billingStatus?.interval === 'yearly' ? 'yearly' : 'monthly'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${accent.badge}`}
                  >
                    {STATUS_LABELS[billingStatus?.status ?? 'none'] ?? billingStatus?.status}
                  </span>
                </div>

                {billingStatus?.status === 'past_due' &&
                  billingStatus.past_due_grace_ends_at && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      Payment failed. Premium access continues until{' '}
                      {formatDate(billingStatus.past_due_grace_ends_at)} while you
                      update your payment method.
                    </p>
                  </div>
                )}

                {renewalLabel && (
                  <div className={`rounded-lg border px-3 py-2.5 ${accent.border} bg-black/20`}>
                    <p className="text-xs text-gray-400 mb-0.5">
                      {billingStatus?.status === 'canceled' ? 'Access until' : 'Renews on'}
                    </p>
                    <p className="text-sm font-medium text-white">{renewalLabel}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleManageBilling()}
                    disabled={portalLoading || !isOnline}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {portalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : (
                      <CreditCard className="w-4 h-4" aria-hidden />
                    )}
                    Manage billing
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshBillingStatus()}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
                  >
                    Refresh status
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-gray-400" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Free plan</h2>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      Upgrade to Analyst or Investor for extended posts, premium tools, and a
                      verified tick on your profile.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openPremium}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4" aria-hidden />
                  View premium plans
                </button>
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {error}
              </p>
            )}

            <p className="mt-4 text-[11px] text-gray-500 leading-relaxed">
              Payments are processed securely by Stripe. PageShare does not store your card
              details. To change plans, select a new plan in checkout — your current subscription
              is canceled immediately with no mid-cycle refund, then you pay for the new plan.
              Subscription changes may take a moment to reflect after returning from Stripe.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
