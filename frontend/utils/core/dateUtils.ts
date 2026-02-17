/**
 * Date formatting utilities
 * Centralized date formatting functions for consistent date display across the app
 */

/**
 * Format a date string for display
 * Examples: "Jan 15, 2024", "Dec 3, 2023"
 * Returns 'N/A' if date is invalid or null (for ticker components compatibility)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Format a date string with time
 * Examples: "Jan 15, 2024 at 3:45 PM"
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
}

/**
 * Format relative time (e.g. "5m", "2h", "3d" or short date for older).
 * Accepts Date or ISO string. Use addAgoSuffix for "5m ago" style.
 */
export function formatRelativeTime(
  dateOrTimestamp: Date | string,
  options?: { addAgoSuffix?: boolean }
): string {
  const date = typeof dateOrTimestamp === 'string' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const suffix = options?.addAgoSuffix ? ' ago' : '';
  if (diffMins < 1) return options?.addAgoSuffix ? 'Just now' : 'now';
  if (diffMins < 60) return `${diffMins}m${suffix}`;
  if (diffHours < 24) return `${diffHours}h${suffix}`;
  if (diffDays < 7) return `${diffDays}d${suffix}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format relative time with "ago" suffix (e.g. "2h ago", "Just now").
 */
export function formatTimeAgo(timestamp: string): string {
  return formatRelativeTime(timestamp, { addAgoSuffix: true });
}

/**
 * Format "Joined Month Year" for profile (e.g. "Joined Jan 2024").
 */
export function formatJoinedDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Joined recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Joined recently';
    return `Joined ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } catch {
    return 'Joined recently';
  }
}
