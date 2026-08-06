'use client';

import AnalyticsDashboardHero from '@/components/app/predictions/analytics/AnalyticsDashboardHero';
import AnalyticsHowTheyTradeSection from '@/components/app/predictions/analytics/AnalyticsHowTheyTradeSection';
import AnalyticsRecentFormSection from '@/components/app/predictions/analytics/AnalyticsRecentFormSection';
import AnalyticsTrackRecordSection from '@/components/app/predictions/analytics/AnalyticsTrackRecordSection';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';

interface AnalyticsDashboardTabProps {
  dashboard: PredictionAnalyticsDashboard;
  isOwnAnalytics: boolean;
}

export default function AnalyticsDashboardTab({
  dashboard,
  isOwnAnalytics,
}: AnalyticsDashboardTabProps) {
  return (
    <div className="space-y-6">
      <AnalyticsDashboardHero
        dashboard={dashboard}
        isOwnAnalytics={isOwnAnalytics}
      />
      <AnalyticsRecentFormSection dashboard={dashboard} />
      <AnalyticsTrackRecordSection lifetime={dashboard.lifetime} />
      <AnalyticsHowTheyTradeSection style={dashboard.style} />
    </div>
  );
}
