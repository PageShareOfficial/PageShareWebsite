'use client';

interface AnalyticsPredictionsTabProps {
  onSwitchFromDashboard?: () => void;
}

export default function AnalyticsPredictionsTab({
  onSwitchFromDashboard: _onSwitchFromDashboard,
}: AnalyticsPredictionsTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-16 text-center sm:py-20">
      <p className="text-sm font-medium text-white">Predictions history</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        A sortable list of locked predictions with outcomes and returns is
        coming next on this tab.
      </p>
    </div>
  );
}
