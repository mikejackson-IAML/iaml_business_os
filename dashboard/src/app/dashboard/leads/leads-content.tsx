'use client';

import {
  Mail,
  Gauge,
  Users,
  CheckCircle,
  Shield,
  Server,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { ActivityFeed } from '@/dashboard-kit/components/dashboard/activity-feed';
import { AlertList } from '@/dashboard-kit/components/dashboard/alert-list';
import { PlatformStatus } from '@/dashboard-kit/components/dashboard/platform-status';
import { DomainHealthTable } from './components/domain-health-table';
import { InboxPerformanceTable } from './components/inbox-performance-table';
import { CapacityGauge } from './components/capacity-gauge';
import { LeadPipelineChart } from './components/lead-pipeline-chart';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { LeadIntelligenceDashboardData } from '@/dashboard-kit/types/departments/lead-intelligence';
import type { HealthStatus } from '@/dashboard-kit/types';

interface LeadsContentProps {
  data: LeadIntelligenceDashboardData;
}

export function LeadsContent({ data }: LeadsContentProps) {
  const { metrics, capacity, domains, inboxes, platforms, recentImports, alerts } = data;

  // Calculate health score with breakdown
  const healthData = calculateHealthData(data);

  // Transform platforms for PlatformStatus component
  const platformStatusData = platforms.map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    status: p.status,
    creditsRemaining: p.creditsRemaining,
    creditsTotal: p.creditsTotal,
    dailyLimitUsed: p.dailyLimitUsed,
    dailyLimitTotal: p.dailyLimitTotal,
    lastSyncAt: p.lastSyncAt,
    errorMessage: p.errorMessage,
  }));

  return (
    <div className="relative min-h-screen">
      {/* Background pattern */}
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="badge-live">LIVE</span>
              <h1 className="text-display-sm text-foreground">Lead Intelligence</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
          <p className="text-muted-foreground">
            Email capacity &bull; Domain health &bull; Lead pipeline &bull; Platform status
          </p>
          <div className="mt-2">
            <Link
              href="/dashboard"
              className="text-sm text-accent-primary hover:underline"
            >
              &larr; Back to CEO Dashboard
            </Link>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Health Score - Left */}
          <div className="col-span-12 lg:col-span-4">
            <HealthScore
              score={healthData.score}
              status={healthData.status}
              label="Lead Intelligence Health"
              description="Based on platform health, capacity, data quality, and domains"
              breakdown={healthData.breakdown}
              showBreakdown
            />
          </div>

          {/* Key Metrics - Right */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="Daily Email Capacity"
                value={capacity.totalDailyCapacity}
                format="number"
                icon={Mail}
                target={2000}
                status={capacity.totalDailyCapacity >= 2000 ? 'healthy' : 'warning'}
                description={`${capacity.availableCapacity.toLocaleString()} available`}
              />
              <MetricCard
                label="Capacity Utilization"
                value={`${capacity.utilizationPercent.toFixed(0)}%`}
                format="text"
                icon={Gauge}
                status={
                  capacity.utilizationPercent < 85
                    ? 'healthy'
                    : capacity.utilizationPercent < 95
                      ? 'warning'
                      : 'critical'
                }
                description={`${capacity.usedCapacity.toLocaleString()} used today`}
              />
              <MetricCard
                label="Leads Sourced (Week)"
                value={Number(metrics.leadsSourcedThisWeek.value)}
                format="number"
                icon={Users}
                target={500}
                status={Number(metrics.leadsSourcedThisWeek.value) >= 500 ? 'healthy' : 'warning'}
              />
              <MetricCard
                label="Validation Rate"
                value={`${Number(metrics.emailValidationRate.value).toFixed(0)}%`}
                format="text"
                icon={CheckCircle}
                status={
                  Number(metrics.emailValidationRate.value) >= 90
                    ? 'healthy'
                    : Number(metrics.emailValidationRate.value) >= 80
                      ? 'warning'
                      : 'critical'
                }
              />
              <MetricCard
                label="Avg Domain Health"
                value={Number(metrics.avgDomainHealth.value).toFixed(0)}
                format="number"
                icon={Shield}
                target={85}
                status={
                  Number(metrics.avgDomainHealth.value) >= 85
                    ? 'healthy'
                    : Number(metrics.avgDomainHealth.value) >= 70
                      ? 'warning'
                      : 'critical'
                }
              />
              <MetricCard
                label="Platform Status"
                value={metrics.platformStatus.value as string}
                format="text"
                icon={Server}
                status={metrics.platformStatus.status}
              />
            </div>
          </div>

          {/* Capacity Gauge + Domain Summary */}
          <div className="col-span-12 lg:col-span-4">
            <CapacityGauge capacity={capacity} />
          </div>

          {/* Platform Status */}
          <div className="col-span-12 lg:col-span-8">
            <PlatformStatus platforms={platformStatusData} title="Platform Status" />
          </div>

          {/* Alerts */}
          <div className="col-span-12 lg:col-span-4">
            <AlertList alerts={alerts} title="Needs Attention" maxItems={5} />
          </div>

          {/* Domain Health Table */}
          <div className="col-span-12 lg:col-span-8">
            <DomainHealthTable domains={domains} />
          </div>

          {/* Inbox Performance Table */}
          <div className="col-span-12">
            <InboxPerformanceTable inboxes={inboxes} domains={domains} />
          </div>

          {/* Activity Feed */}
          <div className="col-span-12 lg:col-span-4">
            <ActivityFeed activities={[]} title="Recent Activity" maxItems={8} />
          </div>

          {/* Lead Pipeline */}
          <div className="col-span-12 lg:col-span-8">
            <LeadPipelineChart imports={recentImports} />
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateHealthData(data: LeadIntelligenceDashboardData): {
  score: number;
  status: HealthStatus;
  breakdown: { label: string; score: number; status: HealthStatus }[];
} {
  const { platforms, capacity, metrics, alerts } = data;

  // Platform Health (25%)
  const operationalPlatforms = platforms.filter((p) => p.status === 'operational').length;
  const platformScore = platforms.length > 0
    ? Math.round((operationalPlatforms / platforms.length) * 100)
    : 100;
  const platformStatus: HealthStatus =
    platformScore >= 80 ? 'healthy' : platformScore >= 50 ? 'warning' : 'critical';

  // Capacity Available (25%)
  const capacityScore = Math.max(0, Math.round(100 - capacity.utilizationPercent));
  const capacityStatus: HealthStatus =
    capacity.utilizationPercent < 85
      ? 'healthy'
      : capacity.utilizationPercent < 95
        ? 'warning'
        : 'critical';

  // Data Quality (20%)
  const validationRate = Number(metrics.emailValidationRate.value) || 0;
  const dataQualityScore = Math.round(validationRate);
  const dataQualityStatus: HealthStatus =
    validationRate >= 90 ? 'healthy' : validationRate >= 80 ? 'warning' : 'critical';

  // Domain Health (20%)
  const avgDomainHealth = Number(metrics.avgDomainHealth.value) || 0;
  const domainHealthScore = Math.round(avgDomainHealth);
  const domainHealthStatus: HealthStatus =
    avgDomainHealth >= 85 ? 'healthy' : avgDomainHealth >= 70 ? 'warning' : 'critical';

  // No Critical Blockers (10%)
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const blockerScore = criticalAlerts === 0 ? 100 : criticalAlerts === 1 ? 50 : 0;
  const blockerStatus: HealthStatus =
    criticalAlerts === 0 ? 'healthy' : criticalAlerts === 1 ? 'warning' : 'critical';

  // Weighted total
  const totalScore = Math.round(
    platformScore * 0.25 +
      capacityScore * 0.25 +
      dataQualityScore * 0.2 +
      domainHealthScore * 0.2 +
      blockerScore * 0.1
  );

  const status: HealthStatus =
    totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'warning' : 'critical';

  return {
    score: totalScore,
    status,
    breakdown: [
      { label: 'Platform Health', score: platformScore, status: platformStatus },
      { label: 'Capacity Available', score: capacityScore, status: capacityStatus },
      { label: 'Data Quality', score: dataQualityScore, status: dataQualityStatus },
      { label: 'Domain Health', score: domainHealthScore, status: domainHealthStatus },
      { label: 'No Blockers', score: blockerScore, status: blockerStatus },
    ],
  };
}
