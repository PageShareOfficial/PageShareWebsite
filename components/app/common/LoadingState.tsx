'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Loading state component with spinner and optional text
 */
export default function LoadingState({ 
  text = 'Loading...', 
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-gray-400 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin mb-4`} />
      {text && <p className={textSizeClasses[size]}>{text}</p>}
    </div>
  );
}
