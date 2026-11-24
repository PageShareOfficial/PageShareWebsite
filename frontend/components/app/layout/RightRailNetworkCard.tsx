'use client';

import Link from 'next/link';
import RollingNumber from '@/components/app/common/RollingNumber';
import Skeleton from '@/components/app/common/Skeleton';

export interface StatColumn {
  value: number;
  label: string;
}

interface RightRailNetworkCardProps {
  title: string;
  columns: StatColumn[];
  href: string;
  accentClass: string;
  borderClass: string;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  loading?: boolean;
  className?: string;
}

function StatCell({
  value,
  label,
  compact,
}: StatColumn & { compact: boolean }) {
  const sizeClass = compact ? 'text-2xl' : 'text-3xl';
  return (
    <div className="flex-1 text-center min-w-0">
      <p className={`${sizeClass} font-black text-white tracking-tight`}>
        <RollingNumber value={value} />
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function StatCellSkeleton() {
  return (
    <div className="flex-1 text-center min-w-0">
      <Skeleton variant="text" width="50%" height={32} className="mx-auto mb-1" />
      <Skeleton variant="text" width="60%" height={12} className="mx-auto" />
    </div>
  );
}

export default function RightRailNetworkCard({
  title,
  columns,
  href,
  accentClass,
  borderClass,
  ctaLabel,
  onCta,
  ctaDisabled = false,
  loading = false,
  className = '',
}: RightRailNetworkCardProps) {
  const compact = columns.length > 2;

  return (
    <div
      className={`bg-white/5 border rounded-xl p-5 shrink-0 ${borderClass} ${className}`.trim()}
    >
      <Link
        href={href}
        prefetch
        className={`text-lg font-semibold hover:opacity-90 transition-opacity ${accentClass}`}
      >
        {title}
      </Link>
      <div className="mt-4 flex items-start gap-2">
        {loading
          ? columns.map((column) => (
              <StatCellSkeleton key={column.label} />
            ))
          : columns.map((column) => (
              <StatCell
                key={column.label}
                value={column.value}
                label={column.label}
                compact={compact}
              />
            ))}
      </div>
      <button
        type="button"
        onClick={onCta}
        disabled={ctaDisabled}
        className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed bg-white/10 hover:bg-white/15 border border-white/10"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
