'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AvatarWithFallbackProps {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackText?: string;
}

/**
 * Avatar component that shows initials fallback when image fails
 */
export default function AvatarWithFallback({
  src,
  alt,
  size = 40,
  className = '',
  fallbackText,
}: AvatarWithFallbackProps) {
  const [error, setError] = useState(false);
  const initials =
    fallbackText ||
    alt
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
