// Daily Digest Generation
// Generates summary content for daily digest notifications

import { toZonedTime } from 'date-fns-tz';
import { getServerClient } from '../supabase/server';
import { getMobileHealthData } from './mobile-health';
import type { DigestContent, DeviceToken, NotificationPayload } from '../types/notifications';

/**
 * Check if it's time to send digest to this user
 * Returns true if current hour in user's timezone matches their digest_hour
 */
export function isDigestTime(token: DeviceToken): boolean {
  if (!token.digest_enabled) {
    return false;
  }

  try {
    const zonedDate = toZonedTime(new Date(), token.timezone);
    const userLocalHour = zonedDate.getHours();
    return userLocalHour === token.digest_hour;
  } catch {
    // Invalid timezone, default to checking against UTC
    return new Date().getUTCHours() === token.digest_hour;
  }
}

/**
 * Generate digest content from various data sources
 */
export async function generateDigestContent(): Promise<DigestContent> {
  const supabase = getServerClient();

  // Get current health data
  let healthScore = 0;
  let healthStatus = 'unknown';
  try {
    const healthData = await getMobileHealthData();
    healthScore = healthData.overallHealth.score;
    healthStatus = healthData.overallHealth.status;
  } catch (error) {
    console.warn('Failed to fetch health data for digest:', error);
  }

  // Get unresolved alerts count (check if health_alerts table exists)
  let unresolvedAlerts = 0;
  let alertsSummary: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alerts, error } = await (supabase as any)
      .from('health_alerts')
      .select('id, severity, message')
      .eq('resolved', false) as { data: Array<{ id: string; severity: string; message: string }> | null; error: Error | null };

    if (!error && alerts) {
      unresolvedAlerts = alerts.length;
      if (unresolvedAlerts > 0) {
        const criticalCount = alerts.filter(a => a.severity === 'critical').length;
        if (criticalCount > 0) {
          alertsSummary = `${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} need${criticalCount === 1 ? 's' : ''} attention`;
        } else {
          alertsSummary = `${unresolvedAlerts} alert${unresolvedAlerts > 1 ? 's' : ''} need${unresolvedAlerts === 1 ? 's' : ''} attention`;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch alerts for digest:', error);
  }

  // Get workflow activity from last 24 hours
  let workflowsTriggered = 0;
  let workflowsFailed = 0;
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Check if workflow_runs table exists in n8n_brain schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: runs, error } = await (supabase as any)
      .from('workflow_runs')
      .select('status')
      .gte('created_at', twentyFourHoursAgo) as { data: Array<{ status: string }> | null; error: Error | null };

    if (!error && runs) {
      workflowsTriggered = runs.length;
      workflowsFailed = runs.filter(r => r.status === 'failed').length;
    }
  } catch (error) {
    console.warn('Failed to fetch workflow runs for digest:', error);
  }

  return {
    unresolved_alerts: unresolvedAlerts,
    alerts_summary: alertsSummary,
    health_score: healthScore,
    health_status: healthStatus,
    workflows_triggered: workflowsTriggered,
    workflows_failed: workflowsFailed,
  };
}

/**
 * Format digest content into notification payload
 */
export function formatDigestNotification(content: DigestContent): NotificationPayload | null {
  const lines: string[] = [];

  // Health status
  lines.push(`Health: ${content.health_status} (${content.health_score}%)`);

  // Alerts
  if (content.unresolved_alerts > 0) {
    lines.push(content.alerts_summary || `${content.unresolved_alerts} unresolved alerts`);
  }

  // Workflow activity
  if (content.workflows_triggered > 0) {
    if (content.workflows_failed > 0) {
      lines.push(`Workflows: ${content.workflows_triggered} run, ${content.workflows_failed} failed`);
    } else {
      lines.push(`Workflows: ${content.workflows_triggered} run successfully`);
    }
  }

  // Skip "all quiet" digests if nothing notable
  const isAllQuiet = content.unresolved_alerts === 0 &&
                     content.workflows_failed === 0 &&
                     content.health_score >= 80;

  if (isAllQuiet && content.workflows_triggered === 0) {
    // No activity and everything healthy - skip digest
    return null;
  }

  // Build title based on status
  let title = 'Daily Digest';
  if (content.unresolved_alerts > 0) {
    title = `Daily Digest: ${content.unresolved_alerts} Alert${content.unresolved_alerts > 1 ? 's' : ''}`;
  } else if (content.health_score < 80) {
    title = 'Daily Digest: Attention Needed';
  }

  return {
    title,
    body: lines.join(' | '),
    category: 'DIGEST',
    data: {
      type: 'digest',
      health_score: content.health_score,
      unresolved_alerts: content.unresolved_alerts,
    },
  };
}
