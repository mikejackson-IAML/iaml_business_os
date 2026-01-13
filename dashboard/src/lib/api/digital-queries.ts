// Digital Dashboard - Main data aggregator
// Combines all API clients for parallel fetching

import { getSiteStatus, type SiteStatusData } from './uptime';
import { getCoreWebVitals, type CoreWebVitals } from './pagespeed';
import { getDevelopmentMetrics, type DevelopmentMetrics } from './vercel';
import { getGitHubSecurityData, type GitHubSecurityData } from './github';
import { getSentryErrorData, type SentryErrorData } from './sentry';
import { getDatabaseMetrics, type DatabaseMetrics } from './supabase-mgmt';

// ==================== Types ====================

export interface IntegrationStatus {
  id: string;
  name: 'stripe' | 'ghl' | 'email';
  displayName: string;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: Date;
  errorMessage?: string;
}

export interface RegistrationTestResult {
  programId: string;
  programName: string;
  format: 'in-person' | 'virtual';
  status: 'pass' | 'fail' | 'skipped' | 'pending';
  lastRunAt: Date | null;
  durationMs?: number;
  errorMessage?: string;
}

export interface RegistrationTestSummary {
  lastFullTestRun: Date | null;
  totalPaths: number;
  passingPaths: number;
  failingPaths: number;
  inPersonResults: RegistrationTestResult[];
  virtualResults: RegistrationTestResult[];
}

export interface SecurityMetrics {
  sslDaysRemaining: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  authStatus: 'normal' | 'suspicious_pattern' | 'attack_detected';
  errorRate5xx: number;
  failedLoginsLast24h: number;
}

export interface DigitalAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'uptime' | 'performance' | 'security' | 'database' | 'registration' | 'development';
  timestamp: Date;
}

export interface DigitalDashboardData {
  siteStatus: SiteStatusData;
  coreWebVitals: CoreWebVitals;
  registrationTests: RegistrationTestSummary;
  integrations: IntegrationStatus[];
  database: DatabaseMetrics;
  security: SecurityMetrics;
  development: DevelopmentMetrics;
}

// ==================== Data Fetching ====================

export async function getDigitalMetrics(): Promise<{
  siteStatus: SiteStatusData;
  coreWebVitals: CoreWebVitals;
  database: DatabaseMetrics;
  development: DevelopmentMetrics;
  github: GitHubSecurityData;
  sentry: SentryErrorData;
}> {
  // Fetch all metrics in parallel
  const [siteStatus, coreWebVitals, database, development, github, sentry] =
    await Promise.all([
      getSiteStatus(),
      getCoreWebVitals(),
      getDatabaseMetrics(),
      getDevelopmentMetrics(),
      getGitHubSecurityData(),
      getSentryErrorData(),
    ]);

  return {
    siteStatus,
    coreWebVitals,
    database,
    development,
    github,
    sentry,
  };
}

export async function getRegistrationTests(): Promise<RegistrationTestSummary> {
  // In a full implementation, this would fetch from:
  // 1. A Supabase table storing Playwright test results
  // 2. GitHub Actions artifacts
  // 3. A test reporting service

  // For now, return placeholder data
  // TODO: Implement actual test result fetching

  const programs = [
    'HR Strategies',
    'Employment Law',
    'Leadership',
    'Project Management',
    'Strategic Planning',
    'Talent Management',
    'Compensation',
    'Benefits',
    'Workplace Safety',
    'Diversity & Inclusion',
    'Change Management',
    'Performance Management',
    'Employee Relations',
    'HR Analytics',
  ];

  const inPersonResults: RegistrationTestResult[] = programs.map(
    (name, index) => ({
      programId: `prog-${index + 1}`,
      programName: name,
      format: 'in-person' as const,
      status: 'pass' as const, // All passing for demo
      lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      durationMs: 3000 + Math.random() * 2000,
    })
  );

  const virtualPrograms = programs.slice(0, 6);
  const virtualResults: RegistrationTestResult[] = virtualPrograms.map(
    (name, index) => ({
      programId: `prog-v-${index + 1}`,
      programName: name,
      format: 'virtual' as const,
      status: 'pass' as const,
      lastRunAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      durationMs: 2500 + Math.random() * 1500,
    })
  );

  const allResults = [...inPersonResults, ...virtualResults];
  const passingPaths = allResults.filter((r) => r.status === 'pass').length;
  const failingPaths = allResults.filter((r) => r.status === 'fail').length;

  return {
    lastFullTestRun: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 AM today
    totalPaths: allResults.length,
    passingPaths,
    failingPaths,
    inPersonResults,
    virtualResults,
  };
}

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  // Check integration health endpoints
  // In production, these would make actual API calls

  return [
    {
      id: 'stripe',
      name: 'stripe',
      displayName: 'Stripe',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      id: 'ghl',
      name: 'ghl',
      displayName: 'GHL',
      status: 'operational',
      lastChecked: new Date(),
    },
    {
      id: 'email',
      name: 'email',
      displayName: 'Email',
      status: 'operational',
      lastChecked: new Date(),
    },
  ];
}

export async function getSecurityMetrics(
  github: GitHubSecurityData,
  sentry: SentryErrorData
): Promise<SecurityMetrics> {
  // SSL check would typically come from a monitoring service
  // Using placeholder for now
  const sslDaysRemaining = 45; // Would check actual certificate

  return {
    sslDaysRemaining,
    vulnerabilities: github.vulnerabilities,
    authStatus: 'normal', // Would check Supabase Auth logs
    errorRate5xx: sentry.errorRate5xx,
    failedLoginsLast24h: 0, // Would query Supabase Auth
  };
}

// ==================== Alert Generation ====================

export function generateDigitalAlerts(
  siteStatus: SiteStatusData,
  coreWebVitals: CoreWebVitals,
  database: DatabaseMetrics,
  security: SecurityMetrics,
  registrationTests: RegistrationTestSummary,
  development: DevelopmentMetrics
): DigitalAlert[] {
  const alerts: DigitalAlert[] = [];
  const now = new Date();

  // Site uptime alerts
  if (!siteStatus.isOnline) {
    alerts.push({
      id: 'site-down',
      title: 'Site Down',
      description: 'The website is currently unreachable',
      severity: 'critical',
      category: 'uptime',
      timestamp: now,
    });
  } else if (siteStatus.uptimePercent30d < 99) {
    alerts.push({
      id: 'uptime-critical',
      title: 'Critical Uptime Drop',
      description: `30-day uptime is ${siteStatus.uptimePercent30d.toFixed(2)}% (below 99%)`,
      severity: 'critical',
      category: 'uptime',
      timestamp: now,
    });
  } else if (siteStatus.uptimePercent30d < 99.5) {
    alerts.push({
      id: 'uptime-warning',
      title: 'Uptime Below Target',
      description: `30-day uptime is ${siteStatus.uptimePercent30d.toFixed(2)}% (target: 99.9%)`,
      severity: 'warning',
      category: 'uptime',
      timestamp: now,
    });
  }

  // Performance alerts
  if (coreWebVitals.lcp > 4) {
    alerts.push({
      id: 'lcp-critical',
      title: 'Slow Page Load (LCP)',
      description: `LCP is ${coreWebVitals.lcp.toFixed(1)}s (should be under 2.5s)`,
      severity: 'critical',
      category: 'performance',
      timestamp: now,
    });
  } else if (coreWebVitals.lcp > 2.5) {
    alerts.push({
      id: 'lcp-warning',
      title: 'Page Load Needs Improvement',
      description: `LCP is ${coreWebVitals.lcp.toFixed(1)}s (target: under 2.5s)`,
      severity: 'warning',
      category: 'performance',
      timestamp: now,
    });
  }

  // Database alerts
  if (database.storageUsagePercent > 85) {
    alerts.push({
      id: 'db-storage-critical',
      title: 'Database Storage Critical',
      description: `Storage at ${database.storageUsagePercent.toFixed(0)}% of limit`,
      severity: 'critical',
      category: 'database',
      timestamp: now,
    });
  } else if (database.storageUsagePercent > 70) {
    alerts.push({
      id: 'db-storage-warning',
      title: 'Database Storage High',
      description: `Storage at ${database.storageUsagePercent.toFixed(0)}% of limit`,
      severity: 'warning',
      category: 'database',
      timestamp: now,
    });
  }

  if (database.connectionUsagePercent > 90) {
    alerts.push({
      id: 'db-connections-critical',
      title: 'Connection Pool Saturated',
      description: `Using ${database.connectionUsagePercent.toFixed(0)}% of connections`,
      severity: 'critical',
      category: 'database',
      timestamp: now,
    });
  }

  if (database.backupStatus === 'failed') {
    alerts.push({
      id: 'db-backup-failed',
      title: 'Database Backup Failed',
      description: 'Last backup did not complete successfully',
      severity: 'critical',
      category: 'database',
      timestamp: now,
    });
  }

  // Security alerts
  if (security.vulnerabilities.critical > 0) {
    alerts.push({
      id: 'security-critical-vulns',
      title: 'Critical Vulnerabilities',
      description: `${security.vulnerabilities.critical} critical vulnerabilities need immediate attention`,
      severity: 'critical',
      category: 'security',
      timestamp: now,
    });
  }

  if (security.vulnerabilities.high > 5) {
    alerts.push({
      id: 'security-high-vulns',
      title: 'High Severity Vulnerabilities',
      description: `${security.vulnerabilities.high} high severity vulnerabilities found`,
      severity: 'warning',
      category: 'security',
      timestamp: now,
    });
  }

  if (security.sslDaysRemaining < 7) {
    alerts.push({
      id: 'ssl-expiring-critical',
      title: 'SSL Certificate Expiring',
      description: `Certificate expires in ${security.sslDaysRemaining} days`,
      severity: 'critical',
      category: 'security',
      timestamp: now,
    });
  } else if (security.sslDaysRemaining < 30) {
    alerts.push({
      id: 'ssl-expiring-warning',
      title: 'SSL Certificate Renewal Needed',
      description: `Certificate expires in ${security.sslDaysRemaining} days`,
      severity: 'warning',
      category: 'security',
      timestamp: now,
    });
  }

  if (security.errorRate5xx > 5) {
    alerts.push({
      id: 'error-rate-critical',
      title: 'High Error Rate',
      description: `${security.errorRate5xx.toFixed(1)}% of requests are failing`,
      severity: 'critical',
      category: 'security',
      timestamp: now,
    });
  } else if (security.errorRate5xx > 1) {
    alerts.push({
      id: 'error-rate-warning',
      title: 'Elevated Error Rate',
      description: `${security.errorRate5xx.toFixed(1)}% of requests are failing`,
      severity: 'warning',
      category: 'security',
      timestamp: now,
    });
  }

  // Registration test alerts
  if (registrationTests.failingPaths > 0) {
    alerts.push({
      id: 'registration-tests-failing',
      title: 'Registration Tests Failing',
      description: `${registrationTests.failingPaths} of ${registrationTests.totalPaths} registration paths are broken`,
      severity: 'critical',
      category: 'registration',
      timestamp: now,
    });
  }

  // Development alerts
  if (development.lastDeployment?.status === 'failed') {
    alerts.push({
      id: 'deploy-failed',
      title: 'Last Deployment Failed',
      description: 'Most recent deployment did not complete successfully',
      severity: 'warning',
      category: 'development',
      timestamp: now,
    });
  }

  return alerts;
}

// Re-export types from individual modules
export type { SiteStatusData } from './uptime';
export type { CoreWebVitals } from './pagespeed';
export type { DevelopmentMetrics } from './vercel';
export type { DatabaseMetrics } from './supabase-mgmt';
