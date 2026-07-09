'use client';

import { createPortal } from 'react-dom';
import PriceLockBanner from '@/components/app/predictions/PriceLockBanner';
import type { ScrollContainerRect } from '@/hooks/predictions/useScrollPastAnchor';

interface FloatingPriceLockOverlayProps {
  visible: boolean;
  containerRect: ScrollContainerRect;
  lockExpired: boolean;
  lockRemainingSec: number;
}

/** Fixed overlay pinned to the scroll column top (Discord-style floating banner). */
export default function FloatingPriceLockOverlay({
  visible,
  containerRect,
  lockExpired,
  lockRemainingSec,
}: FloatingPriceLockOverlayProps) {
  if (!visible || containerRect.width <= 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-40 border-b border-white/10 bg-black/95 px-3 py-2 shadow-md shadow-black/40 backdrop-blur-md sm:px-4 md:px-5"
      style={{
        top: containerRect.top,
        left: containerRect.left,
        width: containerRect.width,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-3xl">
        <PriceLockBanner
          lockExpired={lockExpired}
          lockRemainingSec={lockRemainingSec}
        />
      </div>
    </div>,
    document.body,
  );
}
