'use client';

/**
 * Reusable skeleton loader component
 * Provides consistent loading state UI with shimmer effect
 */

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  rounded?: boolean | string; // true for default rounded, string for custom rounded class
}

/**
 * Basic skeleton element with shimmer effect
 */
export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  rounded = true,
}: SkeletonProps) {
  const baseClasses = 'bg-white/5 skeleton-shimmer';
  
  const variantClasses = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'rounded',
  };

  const roundedClass = rounded === true 
    ? 'rounded' 
    : rounded === false 
    ? '' 
    : rounded; // Custom rounded class

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${roundedClass} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton for avatar/icon (circular)
 */
export function AvatarSkeleton({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <Skeleton variant="circular" width={size} height={size} className={className} />;
}

/**
 * Skeleton for text lines
 */
export function TextSkeleton({ 
  lines = 1, 
  width = '100%', 
  height = 16,
  className = '',
}: { 
  lines?: number; 
  width?: string | number; 
  height?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '80%' : width}
          height={height}
          rounded={true}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card/container
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 bg-white/5 border border-white/10 rounded-xl ${className}`}>
      <Skeleton variant="text" width="60%" height={20} className="mb-4" />
      <TextSkeleton lines={3} />
    </div>
  );
}
