// Workflow Health Dashboard - Data fetching and types
// Queries for n8n workflow monitoring and error tracking

import { getServerClient } from '@/lib/supabase/server';

// ==================== Types ====================

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  workflow_name: string;
  execution_id: string | null;
  status: 'running' | 'success' | 'error' | 'warning';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  error_node: string | null;
  error_node_type: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  slack_notified: boolean;
  email_notified: boolean;
  has_known_fix: boolean;
}

export interface WorkflowHealth {
  workflow_id: string;
  workflow_name: string;
  runs_last_7_days: number;
  successes_last_7_days: number;
  errors_last_7_days: number;
  unresolved_errors: number;
  last_success: string | null;
  last_error: string | null;
  avg_duration_ms: number | null;
  success_rate_7d: number | null;
}

export interface WorkflowDashboardData {
  recentErrors: WorkflowRun[];
  healthSummary: WorkflowHealth[];
  stats: {
    totalWorkflows: number;
    totalErrorsToday: number;
    unresolvedErrors: number;
    overallSuccessRate: number;
  };
}

// ==================== Helper Functions ====================

export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'running':
      return 'blue';
    default:
      return 'gray';
  }
}

export function getHealthStatus(successRate: number | null): 'healthy' | 'warning' | 'critical' {
  if (successRate === null) return 'warning';
  if (successRate >= 95) return 'healthy';
  if (successRate >= 80) return 'warning';
  return 'critical';
}

// ==================== Data Fetching ====================

/**
 * Get recent workflow errors
 */
export async function getRecentErrors(limit: number = 10): Promise<WorkflowRun[]> {
  const supabase = getServerClient();

  try {
    // Use RPC since n8n_brain schema isn't in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_recent_workflow_errors', { p_limit: limit });

    if (!error && data) {
      return data as WorkflowRun[];
    }
  } catch {
    // RPC might not exist
  }

  // Return empty array if we can't query
  return [];
}

/**
 * Get workflow health summary
 */
export async function getWorkflowHealth(): Promise<WorkflowHealth[]> {
  const supabase = getServerClient();

  try {
    // Use RPC since n8n_brain schema isn't in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_workflow_health_summary');

    if (!error && data) {
      return data as WorkflowHealth[];
    }
  } catch {
    // RPC might not exist
  }

  // Return empty array if we can't query
  return [];
}

/**
 * Get workflow stats
 */
export async function getWorkflowStats(): Promise<{
  totalWorkflows: number;
  totalErrorsToday: number;
  unresolvedErrors: number;
  overallSuccessRate: number;
}> {
  const supabase = getServerClient();

  try {
    // Use raw SQL query since n8n_brain schema isn't in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: statsData, error } = await (supabase as any).rpc('get_workflow_stats_summary');

    if (!error && statsData) {
      return {
        totalWorkflows: statsData.total_workflows || 0,
        totalErrorsToday: statsData.errors_today || 0,
        unresolvedErrors: statsData.unresolved_errors || 0,
        overallSuccessRate: statsData.success_rate_7d || 100,
      };
    }
  } catch {
    // RPC might not exist, use defaults
  }

  // Return defaults if we can't query
  return {
    totalWorkflows: 0,
    totalErrorsToday: 0,
    unresolvedErrors: 0,
    overallSuccessRate: 100,
  };
}

/**
 * Get all workflow dashboard data
 */
export async function getWorkflowDashboardData(): Promise<WorkflowDashboardData> {
  const [recentErrors, healthSummary, stats] = await Promise.all([
    getRecentErrors(),
    getWorkflowHealth(),
    getWorkflowStats(),
  ]);

  return {
    recentErrors,
    healthSummary,
    stats,
  };
}

// ==================== Actions ====================

/**
 * Mark an error as resolved
 */
export async function resolveError(
  runId: string,
  resolvedBy: string = 'dashboard',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc('resolve_workflow_error_dashboard', {
      p_run_id: runId,
      p_resolved_by: resolvedBy,
      p_resolution_notes: notes || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to resolve error' };
  }
}
