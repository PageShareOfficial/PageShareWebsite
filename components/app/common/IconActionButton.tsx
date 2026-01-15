'use client';

import { LucideIcon } from 'lucide-react';
import React from 'react';

interface IconActionButtonProps {
  icon: LucideIcon;
  count?: number;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
  activeColor?: string;
  hoverColor?: string;
  className?: string;
  showCount?: boolean;
}

/**
 * Reusable icon action button component
 * Used for post actions like Like, Comment, Share, etc.
 */
export default function IconActionButton({
  icon: Icon,
  count,
  label,
  onClick,
  isActive = false,
  activeColor = 'red-400',
  hoverColor = 'red-400',
  className = '',
  showCount = true,
}: IconActionButtonProps) {
  // Map color names to Tailwind classes
  const getHoverColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'red-400': 'hover:text-red-400',
      'cyan-400': 'hover:text-cyan-400',
      'blue-400': 'hover:text-blue-400',
      'green-400': 'hover:text-green-400',
    };
    return colorMap[color] || 'hover:text-red-400';
  };

  const getActiveBgClass = (color: string, active: boolean) => {
    if (!active) {
      const colorMap: Record<string, string> = {
        'red-400': 'group-hover:bg-red-400/10',
        'cyan-400': 'group-hover:bg-cyan-400/10',
        'blue-400': 'group-hover:bg-blue-400/10',
        'green-400': 'group-hover:bg-green-400/10',
      };
      return colorMap[color] || 'group-hover:bg-red-400/10';
    }
    const colorMap: Record<string, string> = {
      'red-400': 'bg-red-400/20 group-hover:bg-red-400/30',
      'cyan-400': 'bg-cyan-400/20 group-hover:bg-cyan-400/30',
      'blue-400': 'bg-blue-400/20 group-hover:bg-blue-400/30',
      'green-400': 'bg-green-400/20 group-hover:bg-green-400/30',
    };
    return colorMap[color] || 'bg-red-400/20 group-hover:bg-red-400/30';
  };

  const getActiveIconClass = (color: string, active: boolean) => {
    if (!active) return '';
    const colorMap: Record<string, string> = {
      'red-400': 'fill-red-400 text-red-400',
      'cyan-400': 'fill-cyan-400 text-cyan-400',
      'blue-400': 'fill-blue-400 text-blue-400',
      'green-400': 'fill-green-400 text-green-400',
    };
    return colorMap[color] || 'fill-red-400 text-red-400';
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center space-x-2 ${getHoverColorClass(hoverColor)} transition-colors group flex-1 ${className}`}
      aria-label={label}
      title={label}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${getActiveBgClass(activeColor, isActive)}`}>
        <Icon className={`w-5 h-5 ${getActiveIconClass(activeColor, isActive)}`} />
      </div>
      {showCount && count !== undefined && <span className="text-sm">{count}</span>}
    </button>
  );
}
