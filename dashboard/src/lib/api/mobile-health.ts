// Mobile Health API - Types and aggregation functions
// Provides mobile-optimized health data for iOS app consumption

import { getWorkflowStats } from './workflow-queries';
import { getDigitalMetrics } from './digital-queries';

// ==================== Types ====================

export type HealthStatus = 'healthy' | 'warning' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface TopMetric {
  label: string;
  value: string;
  status: HealthStatus;
}

export interface DepartmentHealth {
  id: string;
  name: string;
  score: number;
  status: HealthStatus;
  alertCount: number;
  topMetrics: TopMetric[];
}

export interface HealthAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  department: string;
  timestamp: string;
}

export interface MobileHealthResponse {
  timestamp: string;
  overallHealth: {
    score: number;
    status: HealthStatus;
  };
  departments: DepartmentHealth[];
  alerts: HealthAlert[];
  totalAlertCount: number;
}

// ==================== Helper Functions ====================

/**
 * Determine health status based on score thresholds
 */
function getStatusFromScore(score: number): HealthStatus {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'warning';
  return 'critical';
}

/**
 * Calculate LCP score based on Core Web Vitals thresholds
 * Good: < 2.5s, Needs Improvement: < 4s, Poor: >= 4s
 */
function getLcpScore(lcpSeconds: number): number {
  if (lcpSeconds < 2.5) return 100;
  if (lcpSeconds < 4) return 75;
  if (lcpSeconds < 5) return 50;
  return 25;
}

// ==================== Main Aggregation Function ====================

/**
 * Aggregate health data from workflow stats and digital metrics
 * into a mobile-optimized format
 */
export async function getMobileHealthData(): Promise<MobileHealthResponse> {
  // Fetch data from existing query functions in parallel
  const [workflowStats, digitalMetrics] = await Promise.all([
    getWorkflowStats(),
    getDigitalMetrics(),
  ]);

  const alerts: HealthAlert[] = [];
  const timestamp = new Date().toISOString();

  // ==================== Workflows Department ====================

  const workflowScore = workflowStats.overallSuccessRate;
  const workflowStatus = getStatusFromScore(workflowScore);

  // Generate workflow alerts
  if (workflowStats.unresolvedErrors > 0) {
    alerts.push({
      id: `workflow-unresolved-${Date.now()}`,
      title: `${workflowStats.unresolvedErrors} unresolved workflow error${workflowStats.unresolvedErrors > 1 ? 's' : ''}`,
      severity: workflowStats.unresolvedErrors >= 3 ? 'critical' : 'warning',
      department: 'workflows',
      timestamp,
    });
  }

  if (workflowStats.totalErrorsToday > 0) {
    alerts.push({
      id: `workflow-errors-today-${Date.now()}`,
      title: `${workflowStats.totalErrorsToday} workflow error${workflowStats.totalErrorsToday > 1 ? 's' : ''} today`,
      severity: 'info',
      department: 'workflows',
      timestamp,
    });
  }

  const workflowDepartment: DepartmentHealth = {
    id: 'workflows',
    name: 'Workflows',
    score: Math.round(workflowScore),
    status: workflowStatus,
    alertCount: alerts.filter(a => a.department === 'workflows').length,
    topMetrics: [
      {
        label: 'Success Rate',
        value: `${workflowScore.toFixed(1)}%`,
        status: workflowStatus,
      },
      {
        label: 'Unresolved Errors',
        value: workflowStats.unresolvedErrors.toString(),
        status: workflowStats.unresolvedErrors === 0 ? 'healthy' :
                workflowStats.unresolvedErrors <= 2 ? 'warning' : 'critical',
      },
    ],
  };

  // ==================== Digital Department ====================

  const { siteStatus, coreWebVitals } = digitalMetrics;

  // Calculate digital score: 50% uptime + 50% LCP
  const uptimeScore = siteStatus.uptimePercent30d;
  const lcpScore = getLcpScore(coreWebVitals.lcp);
  const digitalScore = (uptimeScore * 0.5) + (lcpScore * 0.5);
  const digitalStatus = getStatusFromScore(digitalScore);

  // Generate digital alerts
  if (!siteStatus.isOnline) {
    alerts.push({
      id: `digital-site-down-${Date.now()}`,
      title: 'Site is currently down',
      severity: 'critical',
      department: 'digital',
      timestamp,
    });
  } else if (siteStatus.uptimePercent30d < 99) {
    alerts.push({
      id: `digital-uptime-low-${Date.now()}`,
      title: `Uptime at ${siteStatus.uptimePercent30d.toFixed(2)}%`,
      severity: 'warning',
      department: 'digital',
      timestamp,
    });
  }

  if (coreWebVitals.lcp > 4) {
    alerts.push({
      id: `digital-lcp-critical-${Date.now()}`,
      title: `LCP at ${coreWebVitals.lcp.toFixed(1)}s (should be <2.5s)`,
      severity: 'critical',
      department: 'digital',
      timestamp,
    });
  } else if (coreWebVitals.lcp > 2.5) {
    alerts.push({
      id: `digital-lcp-warning-${Date.now()}`,
      title: `LCP at ${coreWebVitals.lcp.toFixed(1)}s (target <2.5s)`,
      severity: 'warning',
      department: 'digital',
      timestamp,
    });
  }

  const digitalDepartment: DepartmentHealth = {
    id: 'digital',
    name: 'Digital',
    score: Math.round(digitalScore),
    status: digitalStatus,
    alertCount: alerts.filter(a => a.department === 'digital').length,
    topMetrics: [
      {
        label: 'Uptime',
        value: `${siteStatus.uptimePercent30d.toFixed(1)}%`,
        status: siteStatus.uptimePercent30d >= 99.5 ? 'healthy' :
                siteStatus.uptimePercent30d >= 99 ? 'warning' : 'critical',
      },
      {
        label: 'LCP',
        value: `${coreWebVitals.lcp.toFixed(1)}s`,
        status: coreWebVitals.lcp < 2.5 ? 'healthy' :
                coreWebVitals.lcp < 4 ? 'warning' : 'critical',
      },
    ],
  };

  // ==================== Overall Health ====================

  const departments = [workflowDepartment, digitalDepartment];

  // Weighted average of department scores
  const overallScore = departments.reduce((sum, d) => sum + d.score, 0) / departments.length;
  const overallStatus = getStatusFromScore(overallScore);

  // Sort alerts by severity (critical first)
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    timestamp,
    overallHealth: {
      score: Math.round(overallScore),
      status: overallStatus,
    },
    departments,
    alerts,
    totalAlertCount: alerts.length,
  };
}
