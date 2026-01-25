import { Suspense } from 'react';
import { WebIntelSkeleton } from './web-intel-skeleton';
import { WebIntelContent } from './web-intel-content';
import {
  getWebIntelDashboardData,
  getContentDecayWithInventory,
  getThinContentWithInventory,
  getContentSummary,
  getCompetitors,
  getSerpShare,
  getSharedKeywords,
  getRecommendations,
} from '@/lib/api/web-intel-queries';
import { parseDateRange, rangeToDays, type DateRange } from './components/date-range-selector';
import { parsePriorityFilter } from './components/priority-filter';
import { parseAlertTypeFilter } from './components/alert-type-filter';
import { parseRecommendationPriorityFilter } from './components/recommendation-priority-filter';

export const metadata = {
  title: 'Web Intelligence | IAML Business OS',
  description: 'Traffic analytics, keyword rankings, technical SEO, and content performance',
};

// Revalidate every hour (data updates less frequently than leads)
export const revalidate = 3600;

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ range?: string; priority?: string; alertType?: string; recPriority?: string }>;
}

async function WebIntelDataLoader({
  range,
  priorityFilter,
  alertTypeFilter,
  recPriorityFilter,
}: {
  range: DateRange;
  priorityFilter: ReturnType<typeof parsePriorityFilter>;
  alertTypeFilter: ReturnType<typeof parseAlertTypeFilter>;
  recPriorityFilter: ReturnType<typeof parseRecommendationPriorityFilter>;
}) {
  const days = rangeToDays(range);

  // Fetch all data in parallel
  const [data, contentDecay, thinContent, contentSummary, competitors, serpShare, sharedKeywords, recommendations] = await Promise.all([
    getWebIntelDashboardData(days),
    getContentDecayWithInventory(5),
    getThinContentWithInventory(5),
    getContentSummary(),
    getCompetitors(),
    getSerpShare(),
    getSharedKeywords(),
    getRecommendations(true), // activeOnly=true
  ]);

  return (
    <WebIntelContent
      data={data}
      range={range}
      priorityFilter={priorityFilter}
      alertTypeFilter={alertTypeFilter}
      contentDecay={contentDecay}
      thinContent={thinContent}
      contentSummary={contentSummary}
      competitors={competitors}
      serpShare={serpShare}
      sharedKeywords={sharedKeywords}
      recommendations={recommendations}
      recPriorityFilter={recPriorityFilter}
    />
  );
}

export default async function WebIntelDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = parseDateRange(params.range);
  const priorityFilter = parsePriorityFilter(params.priority);
  const alertTypeFilter = parseAlertTypeFilter(params.alertType);
  const recPriorityFilter = parseRecommendationPriorityFilter(params.recPriority);

  return (
    <Suspense fallback={<WebIntelSkeleton />}>
      <WebIntelDataLoader
        range={range}
        priorityFilter={priorityFilter}
        alertTypeFilter={alertTypeFilter}
        recPriorityFilter={recPriorityFilter}
      />
    </Suspense>
  );
}
