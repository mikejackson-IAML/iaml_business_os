// Workflow Health Dashboard - Data fetching and types
// Queries for n8n workflow monitoring and error tracking

import { getServerClient } from '@/lib/supabase/server';

// ==================== Types ====================

// Workflow registry entry with stats
export interface WorkflowRegistry {
  workflow_id: string;
  workflow_name: string;
  description: string | null;
  department: string | null;
  category: string | null;
  tags: string[];
  owner: string | null;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  documentation_url: string | null;
  trigger_type: string | null;
  schedule_description: string | null;
  services: string[];
  is_active: boolean;
  notes: string | null;
  // Stats from workflow_runs
  runs_7d: number;
  success_rate_7d: number | null;
  errors_7d: number;
  unresolved_errors: number;
  last_run: string | null;
  avg_duration_ms: number | null;
}

// Detailed workflow info
export interface WorkflowDetail extends WorkflowRegistry {
  schedule_cron: string | null;
  created_at: string;
  last_success: string | null;
  last_error: string | null;
  total_runs: number;
}

// Workflow execution record
export interface WorkflowExecution {
  id: string;
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
  has_known_fix: boolean;
  trigger_type: string | null;
}

// Error summary by node
export interface WorkflowErrorSummary {
  error_node: string | null;
  error_node_type: string | null;
  error_count: number;
  last_occurrence: string;
  unresolved_count: number;
  sample_message: string | null;
}

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

// ==================== Workflow Registry ====================

/**
 * Get all workflows from the registry with stats
 */
export async function getWorkflowRegistry(): Promise<WorkflowRegistry[]> {
  const supabase = getServerClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_workflow_registry');

    if (!error && data) {
      return data as WorkflowRegistry[];
    }
  } catch {
    // RPC might not exist yet
  }

  return [];
}

/**
 * Get a single workflow by ID with full stats
 */
export async function getWorkflowById(workflowId: string): Promise<WorkflowDetail | null> {
  const supabase = getServerClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_workflow_detail', {
      p_workflow_id: workflowId,
    });

    if (!error && data && data.length > 0) {
      return data[0] as WorkflowDetail;
    }
  } catch {
    // RPC might not exist yet
  }

  return null;
}

/**
 * Get recent executions for a workflow
 */
export async function getWorkflowExecutions(
  workflowId: string,
  limit: number = 50
): Promise<WorkflowExecution[]> {
  const supabase = getServerClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_workflow_executions', {
      p_workflow_id: workflowId,
      p_limit: limit,
    });

    if (!error && data) {
      return data as WorkflowExecution[];
    }
  } catch {
    // RPC might not exist yet
  }

  return [];
}

/**
 * Get error summary by node for a workflow
 */
export async function getWorkflowErrorSummary(workflowId: string): Promise<WorkflowErrorSummary[]> {
  const supabase = getServerClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_workflow_error_summary', {
      p_workflow_id: workflowId,
    });

    if (!error && data) {
      return data as WorkflowErrorSummary[];
    }
  } catch {
    // RPC might not exist yet
  }

  return [];
}

/**
 * Get workflow health status string based on success rate and errors
 */
export function getWorkflowHealthStatus(
  successRate: number | null,
  unresolvedErrors: number
): 'healthy' | 'warning' | 'critical' {
  if (unresolvedErrors > 0) return 'critical';
  if (successRate === null) return 'warning';
  if (successRate >= 95) return 'healthy';
  if (successRate >= 80) return 'warning';
  return 'critical';
}

/**
 * Get criticality color for badges
 */
export function getCriticalityColor(criticality: string): string {
  switch (criticality) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'high':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'medium':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  }
}

/**
 * Get category display name and color
 */
export function getCategoryInfo(category: string | null): { label: string; color: string } {
  switch (category) {
    case 'monitoring':
      return { label: 'Monitoring', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'sync':
      return { label: 'Sync', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'alert':
      return { label: 'Alert', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    case 'integration':
      return { label: 'Integration', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
    case 'report':
      return { label: 'Report', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    default:
      return { label: category || 'Other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' };
  }
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Format time ago for display
 */
export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}
