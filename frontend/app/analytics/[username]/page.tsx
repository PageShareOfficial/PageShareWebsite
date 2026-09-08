'use client';

import { useParams } from 'next/navigation';
import AnalyticsPageContent from '@/components/app/predictions/analytics/AnalyticsPageContent';

export default function AnalystAnalyticsPage() {
  const params = useParams();
  const username = (params?.username as string) || '';

  return <AnalyticsPageContent subjectUsername={username} />;
}
