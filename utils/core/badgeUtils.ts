import { NewsCategory } from '@/types/discover';

/**
 * Get badge color classes for news categories
 * @param category - The news category
 * @returns Tailwind CSS classes for the badge
 */
export function getCategoryBadgeColor(category: NewsCategory): string {
  switch (category) {
    case 'finance':
      return 'bg-green-500/20 text-green-400 border border-green-500/30';
    case 'crypto':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'politics':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'business':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'technology':
      return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

/**
 * Get badge color classes for ticker types
 * @param type - The ticker type ('stock' or 'crypto')
 * @returns Tailwind CSS classes for the badge
 */
export function getTickerTypeBadgeColor(type: 'stock' | 'crypto'): string {
  return type === 'crypto'
    ? 'bg-purple-500/20 text-purple-400 borderborder-purple-500/30'
    : 'bg-blue-500/20 text-blue-400 borderborder-blue-500/30';
}
