/**
 * Utility functions for processing and aggregating chart data
 */

import { ChartDataPoint } from '@/types/ticker';

export type TimeRange = '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all';

/**
 * Get the interval in milliseconds for a given time range
 */
export function getIntervalForTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case '1d':
      return 5 * 60 * 1000; // 5 minutes in milliseconds
    case '5d':
      return 30 * 60 * 1000; // 30 minutes in milliseconds
    case '30d':
    case '90d':
    case '180d':
    case '1y':
    case 'all':
      return 24 * 60 * 60 * 1000; // 1 day in milliseconds
    default:
      return 24 * 60 * 60 * 1000; // Default to 1 day
  }
}

/**
 * Round timestamp down to the nearest interval
 */
function roundToInterval(timestamp: number, intervalMs: number): number {
  return Math.floor(timestamp / intervalMs) * intervalMs;
}

/**
 * Aggregate data points by time intervals
 * Groups points within the same interval and uses the last price in that interval
 */
export function aggregateChartData(
  data: ChartDataPoint[],
  timeRange: TimeRange
): ChartDataPoint[] {
  if (data.length === 0) return [];

  const intervalMs = getIntervalForTimeRange(timeRange);
  
  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group points by interval
  const aggregatedMap = new Map<number, ChartDataPoint>();

  for (const point of sortedData) {
    const timestamp = new Date(point.date).getTime();
    const intervalKey = roundToInterval(timestamp, intervalMs);

    // Use the last point in each interval (most recent price)
    // This ensures we capture the closing price for each interval
    aggregatedMap.set(intervalKey, {
      ...point,
      date: new Date(intervalKey).toISOString(),
    });
  }

  // Convert map back to array and sort
  const aggregated = Array.from(aggregatedMap.values()).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return aggregated;
}

/**
 * Get the interval label for display
 */
export function getIntervalLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case '1d':
      return '5 min';
    case '5d':
      return '30 min';
    case '30d':
    case '90d':
    case '180d':
    case '1y':
    case 'all':
      return '1 day';
    default:
      return '1 day';
  }
}
