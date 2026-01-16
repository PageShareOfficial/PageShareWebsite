'use client';

import { getTickerTypeBadgeColor } from '@/utils/core/badgeUtils';

interface TickerTypeBadgeProps {
  type: 'stock' | 'crypto';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge component for ticker types (Stock/Crypto)
 */
export default function TickerTypeBadge({ type, size = 'sm', className = '' }: TickerTypeBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`${sizeClasses[size]} rounded ${getTickerTypeBadgeColor(type)} ${className}`}>
      {type === 'crypto' ? 'Crypto' : 'Stock'}
    </span>
  );
}
