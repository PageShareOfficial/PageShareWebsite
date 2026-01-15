'use client';

/**
 * User badge component
 * Displays a badge next to user names (e.g., "Verified", "Premium")
 */
interface UserBadgeProps {
  badge: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function UserBadge({ badge, size = 'sm', className = '' }: UserBadgeProps) {
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-[9px]',
    md: 'px-1.5 py-0.5 text-[10px]',
  };

  return (
    <span
      className={`${sizeClasses[size]} font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 flex-shrink-0 ${className}`}
    >
      {badge}
    </span>
  );
}
