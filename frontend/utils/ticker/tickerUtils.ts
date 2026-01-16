/**
 * Utility functions for formatting ticker data
 * Used throughout ticker detail page components
 * 
 * Note: Date formatting functions (formatDate, formatDateTime) have been moved to utils/core/dateUtils.ts
 * Import them from there instead.
 */

import { formatDate } from '@/utils/core/dateUtils';

/**
 * Format large numbers (market cap, volume, supply, etc.)
 * Examples: 1.5B, 500M, 1.2T
 */
export function formatLargeNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return 'N/A';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

/**
 * Format currency values
 */
export function formatCurrency(value: number | null, currency: string = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Date formatting functions moved to utils/core/dateUtils.ts
// Import formatDate and formatDateTime from '@/utils/core/dateUtils' instead

/**
 * Get color class for price change (green/red)
 */
export function getChangeColorClass(change: number | null): string {
  if (change === null || change === undefined || isNaN(change)) {
    return 'text-gray-400';
  }
  
  return change >= 0 ? 'text-green-400' : 'text-red-400';
}

/**
 * Check if value is positive
 */
export function isPositive(value: number | null): boolean {
  if (value === null || value === undefined || isNaN(value)) {
    return false;
  }
  
  return value >= 0;
}

/**
 * Format volume numbers (no currency symbol, just K/M/B/T)
 * Examples: 6.28B, 500M, 1.2T
 * Used for stock volume and crypto 24h volume
 */
export function formatVolume(value: number | null): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return 'N/A';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  } else {
    return value.toFixed(2);
  }
}

/**
 * Format supply numbers for crypto (with commas, no currency symbol)
 * Uses abbreviated format for very large numbers to prevent overflow
 */
export function formatSupply(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  const absValue = Math.abs(value);
  
  // Use abbreviated format for very large numbers (over 1 billion)
  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  } else {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value);
  }
}

/**
 * Format number with commas (no currency symbol)
 */
export function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format ratio values (P/E, P/B, etc.)
 */
export function formatRatio(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  
  return value.toFixed(decimals);
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      // Use formatDate from dateUtils
      return formatDate(dateString);
    }
  } catch (error) {
    return dateString;
  }
}
