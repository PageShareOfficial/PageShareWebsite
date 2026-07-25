'use client';

interface AnalyticsStackedBarChartProps {
  segments: { label: string; value: number; color: string }[];
  height?: number;
  className?: string;
}

export default function AnalyticsStackedBarChart({
  segments,
  height = 12,
  className = '',
}: AnalyticsStackedBarChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return (
      <div
        className={`flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-gray-500 ${className}`}
      >
        No resolved predictions yet
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="flex w-full overflow-hidden rounded-full bg-white/10"
        style={{ height }}
        role="img"
        aria-label="Stacked outcome bar"
      >
        {segments.map((segment) =>
          segment.value > 0 ? (
            <div
              key={segment.label}
              style={{
                width: `${(100 * segment.value) / total}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.label}: ${segment.value}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
        {segments.map((segment) => (
          <span key={segment.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            {segment.label}:{' '}
            <span className="tabular-nums text-gray-300">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
