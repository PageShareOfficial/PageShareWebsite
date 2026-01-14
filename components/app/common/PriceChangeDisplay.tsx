'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChangeDisplayProps {
  change: number;
  changePercent?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Component for displaying price change with color coding
 * Shows positive changes in green, negative in red
 */
export default function PriceChangeDisplay({
  change,
  changePercent,
  showIcon = true,
  size = 'md',
  className = '',
}: PriceChangeDisplayProps) {
  const isPositive = change >= 0;
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const formattedChange = isPositive ? `+${change.toFixed(2)}` : change.toFixed(2);
  const formattedPercent = changePercent !== undefined
    ? (isPositive ? `+${changePercent.toFixed(2)}` : changePercent.toFixed(2))
    : null;

  return (
    <div className={`flex items-center gap-1 ${colorClass} ${sizeClasses[size]} ${className}`}>
      {showIcon && <ChangeIcon className={iconSizeClasses[size]} />}
      <span className="font-medium">{formattedChange}</span>
      {formattedPercent && (
        <>
          <span className="opacity-70">({formattedPercent}%)</span>
        </>
      )}
    </div>
  );
}
