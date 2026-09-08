'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  sizes?: string;
  /** How the image fills its positioned parent (requires explicit parent size). */
  fit?: 'cover' | 'contain';
}

/**
 * Image component with fallback support
 * Shows fallback content when image fails to load or is not provided
 */
export default function ImageWithFallback({
  src,
  alt,
  fallback,
  className = '',
  sizes = '40px',
  fit = 'cover',
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const objectClass = fit === 'contain' ? 'object-contain' : 'object-cover';

  if (!src || imageError) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={objectClass}
        // Load CDN logos in the browser; Next.js optimizer times out on CoinGecko hosts.
        unoptimized
        onError={() => setImageError(true)}
      />
    </div>
  );
}
