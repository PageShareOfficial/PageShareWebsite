'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Inline layout for buttons (spinner + text side by side) */
  inline?: boolean;
  className?: string;
}

/**
 * Loading state component with spinner and optional text
 */
export default function LoadingState({ 
  text = 'Loading...', 
  size = 'md',
  inline = false,
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
    <div className={`flex items-center justify-center gap-2 text-gray-400 ${inline ? 'flex-row py-0' : 'flex-col py-8'} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin ${inline ? '' : 'mb-4'}`} />
      {text && <span className={textSizeClasses[size]}>{text}</span>}
    </div>
  );
}
