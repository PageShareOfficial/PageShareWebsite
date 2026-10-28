'use client';

import {
  useEffect,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';
import { isLogoRequestFailed, markLogoRequestFailed } from '@/utils/ticker/logoCacheUtils';

interface TickerImageProps {
  src?: string;
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  /** Square side length in px; overrides fixed size presets. */
  squarePx?: number;
  className?: string;
  showShimmer?: boolean;
  /**
   * Use `span` so the logo can sit inside post `<p>` text without invalid HTML.
   */
  inline?: boolean;
}

const SIZE_CLASSES = {
  sm: { container: 'w-10 h-10', text: 'text-xs' },
  md: { container: 'w-12 h-12', text: 'text-sm' },
  lg: { container: 'w-16 h-16', text: 'text-base' },
} as const;

const ROOT_BASE_CLASS =
  'rounded-lg bg-white/5 border border-white/10 overflow-hidden relative';

function isLogoApiUrl(src: string | undefined): boolean {
  return Boolean(src?.includes('/api/ticker/logo'));
}

function squareDimensionStyle(squarePx: number | undefined): CSSProperties | undefined {
  if (squarePx == null || squarePx <= 0) return undefined;
  return { width: squarePx, height: squarePx };
}

function rootSizeClassName(
  hasSquareSize: boolean,
  inline: boolean,
  presetContainer: string
): string {
  if (!hasSquareSize) return presetContainer;
  return inline ? 'inline-block shrink-0' : 'shrink-0';
}

/**
 * Ticker logo with initials fallback.
 * Skips repeat fetches for known-failed `/api/ticker/logo` URLs.
 */
export default function TickerImage({
  src,
  ticker,
  size = 'md',
  squarePx,
  className = '',
  showShimmer = false,
  inline = false,
}: TickerImageProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const dimensionStyle = squareDimensionStyle(squarePx);
  const fallbackText = ticker.trim().slice(0, 2).toUpperCase() || '?';
  const Root = inline ? 'span' : 'div';
  const Frame = inline ? 'span' : 'div';
  const sizeClassName = rootSizeClassName(
    dimensionStyle != null,
    inline,
    sizeClass.container
  );

  useEffect(() => {
    if (!isLogoApiUrl(src) || !isLogoRequestFailed(ticker)) return;
    setImageError(true);
  }, [src, ticker]);

  const handleImageError = () => {
    setImageError(true);
    if (isLogoApiUrl(src)) markLogoRequestFailed(ticker);
  };

  const hideShimmer = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!showShimmer) return;
    const shimmer = event.currentTarget.previousElementSibling as HTMLElement | null;
    if (shimmer) shimmer.style.display = 'none';
  };

  return (
    <Root
      style={dimensionStyle}
      className={`${sizeClassName} ${ROOT_BASE_CLASS} ${className}`.trim()}
    >
      {src && !imageError ? (
        <>
          {showShimmer ? (
            <Frame className="absolute inset-0 block skeleton-shimmer" />
          ) : null}
          <img
            src={src}
            alt={inline ? '' : ticker}
            className="relative z-10 h-full w-full object-cover"
            onLoad={hideShimmer}
            onError={handleImageError}
          />
        </>
      ) : (
        <Frame
          className={`flex h-full w-full items-center justify-center bg-white/10 ${
            inline ? 'inline-flex' : ''
          }`}
        >
          <span className={`font-semibold text-white ${sizeClass.text}`}>
            {fallbackText}
          </span>
        </Frame>
      )}
    </Root>
  );
}
