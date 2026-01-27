import { Suspense } from 'react';
import { AnalyticsSkeleton } from './analytics-skeleton';
import { AnalyticsContent } from './analytics-content';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
