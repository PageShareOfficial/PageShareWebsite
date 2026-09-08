'use client';

interface SparkPoint {
  cumulative_net_rr: number;
}

interface AnalyticsNetRrSparklineProps {
  series: SparkPoint[];
  className?: string;
}

export default function AnalyticsNetRrSparkline({
  series,
  className = '',
}: AnalyticsNetRrSparklineProps) {
  const width = 320;
  const height = 80;
  const padding = 4;

  if (series.length === 0) {
    return (
      <div
        className={`flex h-20 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-gray-500 ${className}`}
      >
        Chart appears after the first resolved prediction in 30 days.
      </div>
    );
  }

  const values = series.map((p) => p.cumulative_net_rr);
  const minY = Math.min(0, ...values);
  const maxY = Math.max(0, ...values);
  const range = maxY - minY || 1;

  const points = values.map((value, index) => {
    const x =
      padding +
      (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((value - minY) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const zeroY =
    height - padding - ((0 - minY) / range) * (height - padding * 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-20 w-full text-emerald-400 ${className}`}
      role="img"
      aria-label="Cumulative Net RR over the last 30 days"
    >
      <line
        x1={padding}
        y1={zeroY}
        x2={width - padding}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth={1}
      />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.join(' ')}
      />
    </svg>
  );
}
