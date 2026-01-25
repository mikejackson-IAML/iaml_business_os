'use client';

import { Globe, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserMenu } from '@/components/UserMenu';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import type {
  WebIntelDashboardData,
  ContentDecayWithInventory,
  ThinContentWithInventory,
  ContentSummary,
  Competitor,
  SerpShare,
  SharedKeyword,
  RecommendationDb,
} from '@/lib/api/web-intel-queries';
import { DateRangeSelector, rangeToDays, type DateRange } from './components/date-range-selector';
import { ContentHealthSection } from './components/content-health-section';
import { CompetitorsSection } from './components/competitors-section';
import { TrafficMetricsRow } from './components/traffic-metrics-row';
import { TrafficSourcesChart } from './components/traffic-sources-chart';
import { PriorityFilter, type KeywordPriorityFilter } from './components/priority-filter';
import { KeywordsTable } from './components/keywords-table';
import { CoreWebVitalsCard } from './components/core-web-vitals-card';
import { GscMetricsRow } from './components/gsc-metrics-row';
import { TopQueriesList } from './components/top-queries-list';
import { AlertsSection } from './components/alerts-section';
import type { AlertTypeFilterValue } from './components/alert-type-filter';
import { RecommendationsSection } from './components/recommendations-section';
import type { RecommendationPriorityFilterValue } from './components/recommendation-priority-filter';
import { Badge } from '@/dashboard-kit/components/ui/badge';

interface WebIntelContentProps {
  data: WebIntelDashboardData;
  range: DateRange;
  priorityFilter: KeywordPriorityFilter;
  alertTypeFilter: AlertTypeFilterValue;
  contentDecay: ContentDecayWithInventory[];
  thinContent: ThinContentWithInventory[];
  contentSummary: ContentSummary;
  competitors: Competitor[];
  serpShare: SerpShare | null;
  sharedKeywords: SharedKeyword[];
  recommendations: RecommendationDb[];
  recPriorityFilter: RecommendationPriorityFilterValue;
}

export function WebIntelContent({
  data,
  range,
  priorityFilter,
  alertTypeFilter,
  contentDecay,
  thinContent,
  contentSummary,
  competitors,
  serpShare,
  sharedKeywords,
  recommendations,
  recPriorityFilter,
}: WebIntelContentProps) {
  const days = rangeToDays(range);
  const { dailyTraffic, trafficSources, topPages, alerts, health, keywords, rankings, coreWebVitals, searchPerformance } = data;
  const alertCount = alerts.length;

  // Transform recommendations to frontend format
  const transformedRecs = recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority as 'high' | 'medium' | 'low',
    createdAt: new Date(r.created_at),
  }));
  const recommendationCount = transformedRecs.length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-500" />
            <h1 className="text-display-sm text-foreground">Web Intelligence</h1>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeSelector currentRange={range} />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground">
          Traffic analytics, keyword rankings, technical SEO health, and content performance
        </p>
      </header>

      {/* Traffic Metrics Row (TRAF-01 through TRAF-04) */}
      <TrafficMetricsRow dailyTraffic={dailyTraffic} days={days} />

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {alertCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                {alertCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="recommendations" className="relative">
            Recommendations
            {recommendationCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                {recommendationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Traffic Sources Chart (TRAF-05) */}
              <TrafficSourcesChart trafficSources={trafficSources} />

              {/* Top Pages Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No page traffic data available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topPages.slice(0, 5).map((page, i) => (
                        <div
                          key={page.pagePath || i}
                          className="flex justify-between items-center p-2 rounded bg-muted/50"
                        >
                          <span className="truncate max-w-[70%]">{page.pagePath}</span>
                          <span className="text-muted-foreground">
                            {page.pageviews?.toLocaleString() ?? 0} views
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Health Score */}
              <HealthScore
                score={health.score}
                status={health.status}
                label="SEO Health"
                description="Based on rankings, technical health, and content quality"
              />

              {/* Alerts Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alertCount === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No active alerts.
                    </p>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-3xl font-semibold text-foreground">{alertCount}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        active {alertCount === 1 ? 'alert' : 'alerts'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          {/* Filter toolbar */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Keyword Rankings</h2>
            <PriorityFilter currentPriority={priorityFilter} />
          </div>

          {/* Keywords table */}
          <KeywordsTable
            keywords={keywords}
            rankings={rankings}
            priorityFilter={priorityFilter}
          />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          {/* Core Web Vitals Card (CWV-01 through CWV-05) */}
          <CoreWebVitalsCard coreWebVitals={coreWebVitals} />

          {/* GSC Summary Metrics (GSC-01 through GSC-04) */}
          <GscMetricsRow searchPerformance={searchPerformance} days={days} />

          {/* Top Queries List (GSC-05) */}
          <TopQueriesList searchPerformance={searchPerformance} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsSection
            alerts={alerts.map((a) => ({
              id: a.id,
              title: a.title,
              message: a.description ?? '',
              severity: a.severity as 'info' | 'warning' | 'critical',
              alertType: a.category ?? 'technical',
              createdAt: a.timestamp ?? new Date(),
            }))}
            currentFilter={alertTypeFilter}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Content Health - left side */}
            <div className="col-span-12 lg:col-span-6">
              <ContentHealthSection
                summary={contentSummary}
                decayPages={contentDecay}
                thinPages={thinContent}
              />
            </div>

            {/* Competitors - right side */}
            <div className="col-span-12 lg:col-span-6">
              <CompetitorsSection
                competitors={competitors}
                serpShare={serpShare}
                sharedKeywords={sharedKeywords}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsSection
            recommendations={transformedRecs}
            currentFilter={recPriorityFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
