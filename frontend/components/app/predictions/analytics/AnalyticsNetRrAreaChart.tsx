'use client';

interface NetRrPoint {
  cumulative_net_rr: number;
  resolved_at?: string;
}

interface AnalyticsNetRrAreaChartProps {
  series: NetRrPoint[];
  title?: string;
  caption?: string;
  heightClass?: string;
  className?: string;
}

export default function AnalyticsNetRrAreaChart({
  series,
  title,
  caption,
  heightClass = 'h-44 sm:h-52',
  className = '',
}: AnalyticsNetRrAreaChartProps) {
  const width = 400;
  const height = 160;
  const paddingX = 8;
  const paddingY = 12;

  if (series.length === 0) {
    return (
      <div
        className={`flex ${heightClass} flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 text-center text-xs text-gray-500 ${className}`}
      >
        <p>Chart appears after the first resolved prediction in 30 days.</p>
      </div>
    );
  }

  const values = series.map((p) => p.cumulative_net_rr);
  const minY = Math.min(0, ...values);
  const maxY = Math.max(0, ...values);
  const range = maxY - minY || 1;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const coords = values.map((value, index) => {
    const x =
      paddingX + (index / Math.max(values.length - 1, 1)) * chartW;
    const y =
      paddingY + chartH - ((value - minY) / range) * chartH;
    return { x, y, value };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPoints = [
    `${coords[0]?.x ?? paddingX},${paddingY + chartH}`,
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1]?.x ?? paddingX},${paddingY + chartH}`,
  ].join(' ');

  const zeroY = paddingY + chartH - ((0 - minY) / range) * chartH;
  const lastValue = values[values.length - 1] ?? 0;
  const lineColor =
    lastValue >= 0 ? 'rgb(52 211 153)' : 'rgb(248 113 113)';

  return (
    <div className={`rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4 ${className}`}>
      {(title || caption) && (
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          {title ? (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {title}
            </p>
          ) : null}
          {caption ? (
            <p className="text-lg font-bold tabular-nums text-white">{caption}</p>
          ) : null}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full ${heightClass} text-emerald-400`}
        role="img"
        aria-label="Cumulative Net RR chart"
      >
        <defs>
          <linearGradient id="netRrAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = paddingY + chartH * (1 - fraction);
          return (
            <line
              key={fraction}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="white"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          );
        })}
        <line
          x1={paddingX}
          y1={zeroY}
          x2={width - paddingX}
          y2={zeroY}
          stroke="white"
          strokeOpacity={0.12}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <polygon points={areaPoints} fill="url(#netRrAreaFill)" />
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={linePoints}
        />
        {coords.length > 0 ? (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r={4}
            fill={lineColor}
          />
        ) : null}
      </svg>
    </div>
  );
}
