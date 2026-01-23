'use client';

import { Globe, TrendingUp, Activity, FileText, Link2, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/dashboard-kit/components/ui/tabs';
import type { WebIntelDashboardData } from '@/lib/api/web-intel-queries';
import type { HealthStatus } from '@/dashboard-kit/types';

interface WebIntelContentProps {
  data: WebIntelDashboardData;
}

// Helper to determine metric status based on thresholds
function getMetricStatus(value: number, warningThreshold?: number, criticalThreshold?: number): HealthStatus {
  if (criticalThreshold !== undefined && value >= criticalThreshold) return 'critical';
  if (warningThreshold !== undefined && value >= warningThreshold) return 'warning';
  return 'healthy';
}

// Position status - lower is better for rankings
function getPositionStatus(avgPosition: number): HealthStatus {
  if (avgPosition === 0) return 'healthy'; // No data
  if (avgPosition <= 10) return 'healthy';
  if (avgPosition <= 20) return 'warning';
  return 'critical';
}

export function WebIntelContent({ data }: WebIntelContentProps) {
  const { metrics, dailyTraffic, topPages, alerts, health } = data;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-blue-500" />
          <h1 className="text-display-sm text-foreground">Web Intelligence</h1>
        </div>
        <p className="text-muted-foreground">
          Traffic analytics, keyword rankings, technical SEO health, and content performance
        </p>
      </header>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Daily Sessions"
          value={metrics.dailySessions}
          icon={TrendingUp}
          format="number"
          status="healthy"
        />
        <MetricCard
          label="Avg Position"
          value={metrics.avgKeywordPosition || '-'}
          icon={Activity}
          format="number"
          status={getPositionStatus(metrics.avgKeywordPosition)}
        />
        <MetricCard
          label="Indexed Pages"
          value={metrics.indexedPages}
          icon={FileText}
          format="number"
          status="healthy"
        />
        <MetricCard
          label="Backlinks"
          value={metrics.backlinkCount}
          icon={Link2}
          format="number"
          status="healthy"
        />
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left column */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Traffic Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Traffic chart will be implemented in Phase 2.
                    {dailyTraffic.length > 0 && (
                      <span className="block mt-2">
                        Latest: {dailyTraffic[0]?.sessions?.toLocaleString() ?? 0} sessions
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

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

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No active alerts.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded border-l-4 ${
                            alert.severity === 'critical'
                              ? 'border-red-500 bg-red-500/10'
                              : alert.severity === 'warning'
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-blue-500 bg-blue-500/10'
                          }`}
                        >
                          <p className="font-medium text-sm">{alert.title}</p>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Rankings tab content will be implemented in Phase 3.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Technical health tab will be implemented in Phase 4.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content tab will be implemented in Phase 5.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
