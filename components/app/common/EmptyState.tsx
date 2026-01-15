'use client';

import { SearchX, Inbox, Package } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon?: 'search' | 'inbox' | 'package' | React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Empty state component for displaying "no results" or "no data" states
 */
export default function EmptyState({ 
  icon = 'inbox', 
  title, 
  description,
  className = '' 
}: EmptyStateProps) {
  const getIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    const iconSize = 'w-8 h-8';
    const iconClass = `${iconSize} mb-4 opacity-50`;

    switch (icon) {
      case 'search':
        return <SearchX className={iconClass} />;
      case 'package':
        return <Package className={iconClass} />;
      case 'inbox':
      default:
        return <Inbox className={iconClass} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-gray-400 ${className}`}>
      {getIcon()}
      <p className="text-lg mb-1">{title}</p>
      {description && <p className="text-sm mt-1 text-gray-500">{description}</p>}
    </div>
  );
}
