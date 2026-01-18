// Speed Audit Dashboard - Data fetching and types
// Queries for weekly speed audit tracking and approval workflow

import { getServerClient } from '@/lib/supabase/server';

// ==================== Types ====================

export interface SpeedAudit {
  id: string;
  audit_date: string;
  audit_week: string;

  // Aggregate scores
  avg_pagespeed_mobile: number | null;
  avg_pagespeed_desktop: number | null;
  avg_lcp_ms: number | null;
  avg_cls: number | null;
  avg_fcp_ms: number | null;
  avg_ttfb_ms: number | null;
  avg_speed_index: number | null;

  // Issue counts
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;

  // Week-over-week
  mobile_score_delta: number | null;
  desktop_score_delta: number | null;
  lcp_delta_ms: number | null;

  // Status
  status: 'pending' | 'approved' | 'partial' | 'executed' | 'deferred' | 'completed';
  approved_at: string | null;
  approved_by: string | null;
  executed_at: string | null;
  completed_at: string | null;

  // PRD
  prd_generated_at: string | null;
  prd_file_path: string | null;

  created_at: string;
}

export interface SpeedAuditItem {
  id: string;
  audit_id: string;
  item_code: string;
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  page_url: string | null;
  file_path: string | null;
  title: string;
  description: string | null;
  fix_suggestion: string | null;
  estimated_impact: string | null;
  estimated_savings_ms: number | null;
  estimated_savings_bytes: number | null;

  // Workflow
  approved: boolean;
  approved_at: string | null;
  deferred: boolean;
  deferred_reason: string | null;
  executed: boolean;
  executed_at: string | null;
  validated: boolean;
  improvement_measured_ms: number | null;

  priority_score: number;
  created_at: string;
}

export interface SpeedAuditSummary {
  id: string;
  audit_date: string;
  audit_week: string;
  avg_pagespeed_mobile: number | null;
  avg_pagespeed_desktop: number | null;
  avg_lcp_ms: number | null;
  avg_cls: number | null;
  mobile_score_delta: number | null;
  desktop_score_delta: number | null;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  total_issues: number;
  status: string;
  items_approved: number;
  items_executed: number;
  items_validated: number;
  created_at: string;
}

export interface SpeedAuditTrend {
  audit_week: string;
  audit_date: string;
  avg_pagespeed_mobile: number | null;
  avg_pagespeed_desktop: number | null;
  avg_lcp_ms: number | null;
  avg_cls: number | null;
  mobile_score_delta: number | null;
  desktop_score_delta: number | null;
  total_issues: number;
}

export interface SpeedAuditDashboardData {
  currentAudit: SpeedAudit | null;
  currentItems: SpeedAuditItem[];
  recentAudits: SpeedAuditSummary[];
  trends: SpeedAuditTrend[];
  stats: {
    totalAudits: number;
    totalItemsFixed: number;
    avgMobileImprovement: number;
    avgDesktopImprovement: number;
  };
}

// ==================== Helper Functions ====================

function getScoreColor(score: number | null): string {
  if (score === null) return 'gray';
  if (score >= 90) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

function getScoreStatus(score: number | null, target: number): 'pass' | 'warn' | 'fail' {
  if (score === null) return 'fail';
  if (score >= target) return 'pass';
  if (score >= target - 20) return 'warn';
  return 'fail';
}

// ==================== Data Fetching ====================

/**
 * Get the most recent audit (pending or otherwise)
 */
export async function getCurrentAudit(): Promise<SpeedAudit | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('speed_audits')
    .select('*')
    .order('audit_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching current audit:', error);
    return null;
  }

  return data;
}

/**
 * Get items for a specific audit
 */
export async function getAuditItems(auditId: string): Promise<SpeedAuditItem[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('speed_audit_items')
    .select('*')
    .eq('audit_id', auditId)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Error fetching audit items:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent audit summaries for the table
 */
export async function getRecentAudits(limit: number = 10): Promise<SpeedAuditSummary[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('speed_audit_summary')
    .select('*')
    .order('audit_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent audits:', error);
    return [];
  }

  return data || [];
}

/**
 * Get audit trends for charts
 */
export async function getAuditTrends(): Promise<SpeedAuditTrend[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('speed_audit_trends')
    .select('*')
    .limit(12);

  if (error) {
    console.error('Error fetching audit trends:', error);
    return [];
  }

  // Reverse to show oldest first for chart
  return (data || []).reverse();
}

/**
 * Get aggregate stats
 */
export async function getAuditStats(): Promise<{
  totalAudits: number;
  totalItemsFixed: number;
  avgMobileImprovement: number;
  avgDesktopImprovement: number;
}> {
  const supabase = getServerClient();

  // Get total audits
  const { count: totalAudits } = await supabase
    .from('speed_audits')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'pending');

  // Get total items fixed
  const { count: totalItemsFixed } = await supabase
    .from('speed_audit_items')
    .select('*', { count: 'exact', head: true })
    .eq('validated', true);

  // Get average improvements
  const { data: improvements } = await supabase
    .from('speed_audits')
    .select('mobile_score_delta, desktop_score_delta')
    .not('mobile_score_delta', 'is', null)
    .gte('mobile_score_delta', 0) as { data: { mobile_score_delta: number | null; desktop_score_delta: number | null }[] | null };

  let avgMobileImprovement = 0;
  let avgDesktopImprovement = 0;

  if (improvements && improvements.length > 0) {
    const validMobile = improvements.filter(i => i.mobile_score_delta !== null);
    const validDesktop = improvements.filter(i => i.desktop_score_delta !== null);

    if (validMobile.length > 0) {
      avgMobileImprovement = Math.round(
        validMobile.reduce((sum, i) => sum + (i.mobile_score_delta || 0), 0) / validMobile.length
      );
    }
    if (validDesktop.length > 0) {
      avgDesktopImprovement = Math.round(
        validDesktop.reduce((sum, i) => sum + (i.desktop_score_delta || 0), 0) / validDesktop.length
      );
    }
  }

  return {
    totalAudits: totalAudits || 0,
    totalItemsFixed: totalItemsFixed || 0,
    avgMobileImprovement,
    avgDesktopImprovement,
  };
}

/**
 * Get all dashboard data in parallel
 */
export async function getSpeedAuditDashboardData(): Promise<SpeedAuditDashboardData> {
  const [currentAudit, recentAudits, trends, stats] = await Promise.all([
    getCurrentAudit(),
    getRecentAudits(),
    getAuditTrends(),
    getAuditStats(),
  ]);

  // Get items for current audit if exists
  const currentItems = currentAudit ? await getAuditItems(currentAudit.id) : [];

  return {
    currentAudit,
    currentItems,
    recentAudits,
    trends,
    stats,
  };
}

// ==================== Actions ====================

/**
 * Approve items for an audit
 */
export async function approveAuditItems(
  auditId: string,
  itemIds: string[],
  approvedBy: string = 'dashboard'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('speed_audit_items')
    .update({
      approved: true,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('audit_id', auditId)
    .in('id', itemIds);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update audit status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('speed_audits')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', auditId);

  return { success: true };
}

/**
 * Defer an audit to next week
 */
export async function deferAudit(
  auditId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('speed_audits')
    .update({ status: 'deferred' })
    .eq('id', auditId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark item as executed
 */
export async function markItemExecuted(
  itemId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('speed_audit_items')
    .update({
      executed: true,
      executed_at: new Date().toISOString(),
      execution_notes: notes,
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Record validation results for an item
 */
export async function recordItemValidation(
  itemId: string,
  improvementMs: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('speed_audit_items')
    .update({
      validated: true,
      validated_at: new Date().toISOString(),
      improvement_measured_ms: improvementMs,
      validation_notes: notes,
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
