'use client';

import { useState, useEffect } from 'react';
import { isLogoRequestFailed, markLogoRequestFailed } from '@/utils/ticker/logoCacheUtils';

interface TickerImageProps {
  src?: string;
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showShimmer?: boolean;
}

const sizeClasses = {
  sm: { container: 'w-10 h-10', text: 'text-xs' },
  md: { container: 'w-12 h-12', text: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-base' },
};

/**
 * Reusable ticker image component with fallback to ticker initials
 * Shows ticker logo if available, otherwise displays first 2 characters of ticker
 * Uses cache to prevent repeated API calls for tickers without logos
 */
export default function TickerImage({
  src,
  ticker,
  size = 'md',
  className = '',
  showShimmer = false,
}: TickerImageProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const fallbackText = ticker.substring(0, 2).toUpperCase();

  // Check cache on mount - if ticker logo request failed before, skip loading
  useEffect(() => {
    if (src && typeof window !== 'undefined') {
      // Check if this is a logo API URL (contains /api/ticker/logo)
      const isLogoApiUrl = src.includes('/api/ticker/logo');
      if (isLogoApiUrl && isLogoRequestFailed(ticker)) {
        // Logo request failed before, skip loading and go straight to fallback
        setImageError(true);
      }
    }
  }, [src, ticker]);

  const handleImageError = () => {
    setImageError(true);
    // Mark this ticker logo request as failed in cache
    if (src && src.includes('/api/ticker/logo')) {
      markLogoRequestFailed(ticker);
    }
  };

  return (
    <div
      className={`${sizeClass.container} rounded-lg bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden relative ${className}`}
    >
      {src && !imageError ? (
        <>
          {showShimmer && (
            <div className="absolute inset-0 skeleton-shimmer" />
          )}
          <img
            src={src}
            alt={ticker}
            className="w-full h-full object-cover relative z-10"
            onLoad={(e) => {
              if (showShimmer) {
                const shimmer = e.currentTarget.previousElementSibling as HTMLElement;
                if (shimmer) shimmer.style.display = 'none';
              }
            }}
            onError={handleImageError}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/10">
          <span className={`font-semibold text-white ${sizeClass.text}`}>
            {fallbackText}
          </span>
        </div>
      )}
    </div>
  );
}
