import type { ReactNode } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { FaMedal } from 'react-icons/fa';
import type { AnalystScoreSummary } from '@/types/predictions';
import ShowAllButton from '@/components/app/common/ShowAllButton';
import { getAnalyticsPath } from '@/utils/predictions/analyticsRoutes';

interface AnalystStatsSectionProps {
  score: AnalystScoreSummary;
}

function StatCard({
  label,
  value,
  icon,
  accentClass,
  gradientClass,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accentClass: string;
  gradientClass?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 p-4 ${
        gradientClass ?? 'bg-white/[0.03]'
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${accentClass}`}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

export default function AnalystStatsSection({ score }: AnalystStatsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="Rank"
          value={`#${score.rank}`}
          icon={<FaMedal className="h-3.5 w-3.5" aria-hidden />}
          accentClass="text-amber-400/90"
          gradientClass="bg-gradient-to-br from-amber-500/10 to-transparent"
        />
        <StatCard
          label="Win rate"
          value={`${score.winRatePercent}%`}
          icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden />}
          accentClass="text-emerald-400/90"
        />
        <StatCard
          label="Total predictions"
          value={String(score.totalPredictions)}
          icon={<Target className="h-3.5 w-3.5" aria-hidden />}
          accentClass="text-sky-400/90"
        />
      </div>
      <ShowAllButton href={getAnalyticsPath()} />
    </section>
  );
}
