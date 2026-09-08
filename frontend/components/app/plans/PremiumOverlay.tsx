'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';
import BillingIntervalToggle from '@/components/app/plans/BillingIntervalToggle';
import PlansPageContent from '@/components/app/plans/PlansPageContent';
import type { BillingInterval } from '@/components/app/plans/planData';

export default function PremiumOverlay() {
  const { isOpen, closePremium } = usePremiumOverlay();
  const [mounted, setMounted] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePremium();
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closePremium]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Premium plans"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-black/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={closePremium}
            className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors shrink-0"
            aria-label="Close premium plans"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base sm:text-lg font-bold text-white truncate">
            Premium plans
          </h2>
        </div>
        <BillingIntervalToggle
          interval={billingInterval}
          onChange={setBillingInterval}
          size="sm"
          theme="neutral"
        />
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <PlansPageContent
          billingInterval={billingInterval}
          onBillingIntervalChange={setBillingInterval}
        />
      </div>
    </div>,
    document.body
  );
}
