'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  clearCheckoutReturnParams,
  getCheckoutReturnStatus,
} from '@/utils/billing/checkoutReturnUrls';

export default function CheckoutReturnBanner() {
  const searchParams = useSearchParams();
  const { refreshBillingStatus } = useSubscription();
  const { openPremium } = usePremiumOverlay();
  const [message, setMessage] = useState<{
    type: 'success' | 'canceled';
    text: string;
  } | null>(null);

  useEffect(() => {
    const status = getCheckoutReturnStatus(searchParams);
    if (!status) return;

    clearCheckoutReturnParams();

    if (status === 'success') {
      void refreshBillingStatus();
      setMessage({
        type: 'success',
        text: 'Subscription active. Welcome to Premium!',
      });
      return;
    }

    setMessage({
      type: 'canceled',
      text: 'Checkout canceled. You can try again anytime.',
    });
    openPremium();
  }, [openPremium, refreshBillingStatus, searchParams]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      setMessage(null);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  const isSuccess = message.type === 'success';

  return (
    <div
      className={`fixed top-4 left-1/2 z-[220] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border px-4 py-3 shadow-lg ${
        isSuccess
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-amber-500/30 bg-amber-500/10'
      }`}
      role="status"
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        )}
        <p
          className={`text-sm font-medium ${
            isSuccess ? 'text-emerald-200' : 'text-amber-200'
          }`}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}
