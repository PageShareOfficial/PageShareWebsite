'use client';

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

interface AnalyticsDonutChartProps {
  segments: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  emptyMessage?: string;
  className?: string;
}

export default function AnalyticsDonutChart({
  segments,
  size = 160,
  strokeWidth = 22,
  centerLabel,
  centerValue,
  emptyMessage = 'No data yet',
  className = '',
}: AnalyticsDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total <= 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-xs text-gray-500 ${className}`}
        style={{ minHeight: size }}
      >
        {emptyMessage}
      </div>
    );
  }

  let offset = 0;
  const rings = segments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const fraction = segment.value / total;
      const dash = fraction * circumference;
      const ring = (
        <circle
          key={segment.label}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={-offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${center} ${center})`}
        />
      );
      offset += dash;
      return ring;
    });

  return (
    <div className={`flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8 ${className}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {rings}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue ? (
              <span className="text-xl font-bold tabular-nums text-white">
                {centerValue}
              </span>
            ) : null}
            {centerLabel ? (
              <span className="text-xs text-gray-400">{centerLabel}</span>
            ) : null}
          </div>
        )}
      </div>
      <ul className="w-full min-w-[140px] space-y-2 sm:w-auto">
        {segments.map((segment) => {
          const pct = total > 0 ? Math.round((100 * segment.value) / total) : 0;
          return (
            <li
              key={segment.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="flex items-center gap-2 text-gray-300">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="tabular-nums text-white">
                {segment.value}{' '}
                <span className="text-gray-500">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
