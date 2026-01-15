'use client';

import { NewsCategory } from '@/types/discover';
import { getCategoryBadgeColor } from '@/utils/core/badgeUtils';

interface CategoryBadgeProps {
  category: NewsCategory;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge component for news article categories
 */
export default function CategoryBadge({ category, size = 'sm', className = '' }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  const displayText = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <span className={`${sizeClasses[size]} font-medium rounded ${getCategoryBadgeColor(category)} ${className}`}>
      {displayText}
    </span>
  );
}
