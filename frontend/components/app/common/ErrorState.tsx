'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Generic error state component
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-gray-300 ${className}`}>
      <AlertTriangle className="w-10 h-10 mb-4 text-amber-400" />
      <p className="text-lg font-semibold text-white mb-1">{title}</p>
      <p className="text-sm text-gray-400 mb-4 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
