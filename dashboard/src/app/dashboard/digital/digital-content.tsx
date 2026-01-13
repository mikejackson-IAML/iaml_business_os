'use client';

import {
  Activity,
  Database,
  Shield,
  Gauge,
  GitBranch,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Server,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import { HealthScore } from '@/dashboard-kit/components/dashboard/health-score';
import { AlertList } from '@/dashboard-kit/components/dashboard/alert-list';
import { RegistrationTestGrid } from '@/dashboard-kit/components/dashboard/registration-test-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { UserMenu } from '@/components/UserMenu';
import { formatBytes } from '@/lib/api/supabase-mgmt';
import type { HealthStatus, AlertItem } from '@/dashboard-kit/types';
import type {
  SiteStatusData,
  CoreWebVitals,
  RegistrationTestSummary,
  IntegrationStatus,
  SecurityMetrics,
  DigitalAlert,
  DevelopmentMetrics,
  DatabaseMetrics,
} from '@/lib/api/digital-queries';

interface DigitalContentProps {
  siteStatus: SiteStatusData;
  coreWebVitals: CoreWebVitals;
  registrationTests: RegistrationTestSummary;
  integrations: IntegrationStatus[];
  database: DatabaseMetrics;
  security: SecurityMetrics;
  development: DevelopmentMetrics;
  alerts: DigitalAlert[];
}

// Convert DigitalAlert to AlertItem format
function mapAlertsToAlertItems(alerts: DigitalAlert[]): AlertItem[] {
  return alerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    category: alert.category,
    timestamp: alert.timestamp,
    dismissable: false,
  }));
}

// Calculate digital health score based on weighted components
function calculateHealthScore(
  siteStatus: SiteStatusData,
  coreWebVitals: CoreWebVitals,
  registrationTests: RegistrationTestSummary,
  database: DatabaseMetrics,
  security: SecurityMetrics,
  alerts: DigitalAlert[]
): {
  score: number;
  status: HealthStatus;
  breakdown: { label: string; score: number; status: HealthStatus }[];
} {
  // 1. Uptime (25%) - Based on 30-day uptime %
  const uptimeScore = Math.min(100, (siteStatus.uptimePercent30d / 99.9) * 100);
  const uptimeStatus: HealthStatus =
    siteStatus.uptimePercent30d >= 99.5
      ? 'healthy'
      : siteStatus.uptimePercent30d >= 99
      ? 'warning'
      : 'critical';

  // 2. Registration Tests (25%) - % of paths passing
  const regTestScore =
    registrationTests.totalPaths > 0
      ? (registrationTests.passingPaths / registrationTests.totalPaths) * 100
      : 100;
  const regTestStatus: HealthStatus =
    regTestScore === 100 ? 'healthy' : regTestScore >= 90 ? 'warning' : 'critical';

  // 3. Performance (15%) - Based on LCP target of 2.5s
  const lcpTarget = 2.5;
  const lcpScore = Math.max(
    0,
    Math.min(100, ((lcpTarget * 2 - coreWebVitals.lcp) / lcpTarget) * 100)
  );
  const performanceStatus: HealthStatus =
    coreWebVitals.lcp <= 2.5
      ? 'healthy'
      : coreWebVitals.lcp <= 4
      ? 'warning'
      : 'critical';

  // 4. Database Health (15%) - Composite of query time, backup, usage
  const usageScore = Math.max(0, Math.min(100, ((100 - database.storageUsagePercent) / 30) * 100));
  const backupScore = database.backupStatus === 'success' ? 100 : 0;
  const connectionScore = Math.max(0, 100 - database.connectionUsagePercent);
  const dbScore = usageScore * 0.4 + backupScore * 0.3 + connectionScore * 0.3;
  const dbStatus: HealthStatus =
    dbScore >= 70 ? 'healthy' : dbScore >= 40 ? 'warning' : 'critical';

  // 5. Security (10%) - Inverse of vulnerability severity
  const criticalVulns = security.vulnerabilities.critical;
  const highVulns = security.vulnerabilities.high;
  const securityScore =
    criticalVulns > 0
      ? 0
      : Math.max(
          0,
          100 - highVulns * 20 - security.vulnerabilities.medium * 5
        );
  const securityStatus: HealthStatus =
    criticalVulns > 0 || highVulns > 5
      ? 'critical'
      : highVulns > 2
      ? 'warning'
      : 'healthy';

  // 6. No Critical Blockers (10%) - Binary: 100 if no critical alerts
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const blockerScore = criticalAlerts === 0 ? 100 : 0;
  const blockerStatus: HealthStatus = criticalAlerts === 0 ? 'healthy' : 'critical';

  // Calculate weighted total
  const totalScore = Math.round(
    uptimeScore * 0.25 +
      regTestScore * 0.25 +
      lcpScore * 0.15 +
      dbScore * 0.15 +
      securityScore * 0.1 +
      blockerScore * 0.1
  );

  const status: HealthStatus =
    totalScore >= 70 ? 'healthy' : totalScore >= 40 ? 'warning' : 'critical';

  return {
    score: totalScore,
    status,
    breakdown: [
      { label: 'Uptime (30d)', score: Math.round(uptimeScore), status: uptimeStatus },
      { label: 'Registration Tests', score: Math.round(regTestScore), status: regTestStatus },
      { label: 'Performance (LCP)', score: Math.round(lcpScore), status: performanceStatus },
      { label: 'Database Health', score: Math.round(dbScore), status: dbStatus },
      { label: 'Security', score: Math.round(securityScore), status: securityStatus },
      { label: 'No Blockers', score: blockerScore, status: blockerStatus },
    ],
  };
}

function formatTimestamp(date: Date | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
}

export function DigitalContent({
  siteStatus,
  coreWebVitals,
  registrationTests,
  integrations,
  database,
  security,
  development,
  alerts,
}: DigitalContentProps) {
  const healthData = calculateHealthScore(
    siteStatus,
    coreWebVitals,
    registrationTests,
    database,
    security,
    alerts
  );
  const alertItems = mapAlertsToAlertItems(alerts);

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
              <h1 className="text-display-sm text-foreground">Digital Dashboard</h1>
            </div>
            <UserMenu />
          </div>
          <p className="text-muted-foreground">
            Site performance • Registration flows • Database • Security
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
          {/* Row 1: Health Score (4 cols) + Key Metrics (8 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <HealthScore
              score={healthData.score}
              status={healthData.status}
              label="Digital Health"
              description="Based on uptime, tests, performance, and security"
              breakdown={healthData.breakdown}
              showBreakdown
            />
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Uptime (30d)"
                value={siteStatus.uptimePercent30d.toFixed(2)}
                format="percent"
                icon={Activity}
                target={99.9}
                status={
                  siteStatus.uptimePercent30d >= 99.5
                    ? 'healthy'
                    : siteStatus.uptimePercent30d >= 99
                    ? 'warning'
                    : 'critical'
                }
                description={siteStatus.isOnline ? 'Online' : 'OFFLINE'}
              />
              <MetricCard
                label="Avg Load Time"
                value={(siteStatus.avgResponseTimeMs / 1000).toFixed(2)}
                description="seconds"
                icon={Gauge}
                status={
                  siteStatus.avgResponseTimeMs <= 2000
                    ? 'healthy'
                    : siteStatus.avgResponseTimeMs <= 3000
                    ? 'warning'
                    : 'critical'
                }
              />
              <MetricCard
                label="Last Deploy"
                value={formatTimestamp(development.lastDeployment?.timestamp || null)}
                icon={GitBranch}
                status={
                  development.lastDeployment?.status === 'success'
                    ? 'healthy'
                    : development.lastDeployment?.status === 'failed'
                    ? 'critical'
                    : 'warning'
                }
                description={development.lastDeployment?.status || 'N/A'}
              />
              <MetricCard
                label="Error Rate"
                value={security.errorRate5xx.toFixed(2)}
                format="percent"
                icon={AlertTriangle}
                status={
                  security.errorRate5xx < 1
                    ? 'healthy'
                    : security.errorRate5xx < 5
                    ? 'warning'
                    : 'critical'
                }
                description={`${security.failedLoginsLast24h} failed logins`}
              />
            </div>
          </div>

          {/* Row 2: Site Status + Web Vitals (8 cols) + Alerts (4 cols) */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Site Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    {siteStatus.isOnline ? (
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    )}
                    <span className="text-2xl font-semibold">
                      {siteStatus.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Uptime: <span className="font-medium text-foreground">{siteStatus.uptimePercent30d.toFixed(2)}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Load: <span className="font-medium text-foreground">{(siteStatus.avgResponseTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>

                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Core Web Vitals
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">LCP</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-semibold ${
                          coreWebVitals.lcp <= 2.5
                            ? 'text-emerald-600'
                            : coreWebVitals.lcp <= 4
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {coreWebVitals.lcp.toFixed(1)}s
                      </span>
                      {coreWebVitals.lcp <= 2.5 && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">FID/TBT</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-semibold ${
                          coreWebVitals.fid <= 100
                            ? 'text-emerald-600'
                            : coreWebVitals.fid <= 300
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {coreWebVitals.fid.toFixed(0)}ms
                      </span>
                      {coreWebVitals.fid <= 100 && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">CLS</div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-semibold ${
                          coreWebVitals.cls <= 0.1
                            ? 'text-emerald-600'
                            : coreWebVitals.cls <= 0.25
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {coreWebVitals.cls.toFixed(2)}
                      </span>
                      {coreWebVitals.cls <= 0.1 && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Performance</div>
                    <div className="text-lg font-semibold">{coreWebVitals.performance}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">SEO</div>
                    <div className="text-lg font-semibold">{coreWebVitals.seo}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <AlertList alerts={alertItems} title="Needs Attention" maxItems={5} />
          </div>

          {/* Row 3: Registration Flows (12 cols) */}
          <div className="col-span-12">
            <RegistrationTestGrid results={registrationTests} integrations={integrations} />
          </div>

          {/* Row 4: Database (6 cols) + Security (6 cols) */}
          <div className="col-span-12 lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Query P95</span>
                  <span className="font-medium">{database.queryP95Ms}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Connections</span>
                  <span className="font-medium">
                    {database.activeConnections}/{database.maxConnections}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Storage Usage</span>
                    <span className="font-medium">{database.storageUsagePercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={database.storageUsagePercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(database.storageUsedBytes)} / {formatBytes(database.storageLimitBytes)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                  <div className="flex items-center gap-2">
                    {database.backupStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : database.backupStatus === 'failed' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="font-medium">
                      {formatTimestamp(database.lastBackupAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">SSL Certificate</span>
                  <span
                    className={`font-medium ${
                      security.sslDaysRemaining < 7
                        ? 'text-red-600'
                        : security.sslDaysRemaining < 30
                        ? 'text-amber-600'
                        : ''
                    }`}
                  >
                    {security.sslDaysRemaining} days remaining
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vulnerabilities</span>
                  <div className="flex items-center gap-2">
                    {security.vulnerabilities.critical > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-400">
                        {security.vulnerabilities.critical} critical
                      </span>
                    )}
                    {security.vulnerabilities.high > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded dark:bg-amber-900/30 dark:text-amber-400">
                        {security.vulnerabilities.high} high
                      </span>
                    )}
                    {security.vulnerabilities.medium > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                        {security.vulnerabilities.medium} med
                      </span>
                    )}
                    {security.vulnerabilities.critical === 0 &&
                      security.vulnerabilities.high === 0 &&
                      security.vulnerabilities.medium === 0 && (
                        <span className="text-emerald-600 font-medium">None</span>
                      )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Auth Status</span>
                  <span
                    className={`font-medium ${
                      security.authStatus === 'attack_detected'
                        ? 'text-red-600'
                        : security.authStatus === 'suspicious_pattern'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {security.authStatus === 'attack_detected'
                      ? 'Attack Detected'
                      : security.authStatus === 'suspicious_pattern'
                      ? 'Suspicious Activity'
                      : 'No suspicious patterns'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Error Rate (5xx)</span>
                  <span
                    className={`font-medium ${
                      security.errorRate5xx > 5
                        ? 'text-red-600'
                        : security.errorRate5xx > 1
                        ? 'text-amber-600'
                        : ''
                    }`}
                  >
                    {security.errorRate5xx.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Development (12 cols) */}
          <div className="col-span-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-md flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Last Deploy</div>
                    <div className="flex items-center gap-2">
                      {development.lastDeployment?.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : development.lastDeployment?.status === 'failed' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium">
                        {formatTimestamp(development.lastDeployment?.timestamp || null)}
                      </span>
                    </div>
                    {development.lastDeployment?.commitMessage && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        &ldquo;{development.lastDeployment.commitMessage}&rdquo;
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Build Success (30d)</div>
                    <div className="text-2xl font-semibold">
                      {development.buildSuccessRate30d.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {development.totalDeployments30d} deploys, {development.failedDeployments30d} failed
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Open Bugs</div>
                    <div className="text-2xl font-semibold">
                      {(security.vulnerabilities.critical || 0) +
                        (security.vulnerabilities.high || 0) +
                        (security.vulnerabilities.medium || 0) +
                        (security.vulnerabilities.low || 0) || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      tracked in GitHub
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Branch</div>
                    <div className="text-lg font-medium">
                      {development.lastDeployment?.branch || 'main'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {development.lastDeployment?.author || 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
