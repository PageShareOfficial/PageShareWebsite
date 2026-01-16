'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  sizes?: string;
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
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

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
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
