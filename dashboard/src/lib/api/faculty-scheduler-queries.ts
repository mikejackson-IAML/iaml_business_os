// Faculty Scheduler Dashboard API
// Queries Supabase for recruitment pipeline, response tracking, and instructor assignments
// Phase 5 of the Faculty Program Scheduler MVP

import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

/**
 * Recruitment pipeline row from dashboard_recruitment_pipeline view.
 * Provides all columns needed for the dashboard table.
 */
export interface RecruitmentPipelineProgram {
  id: string;
  name: string;
  program_type: string | null;
  city: string | null;
  state: string | null;
  start_date: string;
  status: 'draft' | 'tier_0' | 'tier_1' | 'tier_2' | 'filled' | 'completed';
  released_at: string | null;
  tier_0_ends_at: string | null;
  tier_1_ends_at: string | null;
  days_remaining: number | null;
  total_blocks: number;
  open_blocks: number;
  filled_blocks: number;
  notified_count: number;
  responded_count: number;
  assigned_instructor_name: string | null;
  assigned_instructor_id: string | null;
  last_activity_at: string | null;
  tier_display: string;
}

/**
 * Not responded instructor from not_responded_instructors view.
 * Instructors who were notified but haven't claimed.
 */
export interface NotRespondedInstructor {
  instructor_id: string;
  full_name: string;
  email: string;
  firm_state: string | null;
  tier_designation: number | null;
  scheduled_program_id: string;
  program_name: string;
  program_city: string | null;
  program_state: string | null;
  notified_at: string;
  tier_when_notified: number;
  viewed_at: string | null;  // null = not yet viewed
}

/**
 * Dashboard summary stats from dashboard_summary_stats view.
 * Single row providing totals for summary cards.
 */
export interface DashboardSummaryStats {
  total_programs: number;
  awaiting_tier_0: number;
  awaiting_tier_1: number;
  open_programs: number;
  filled_programs: number;
  draft_programs: number;
  programs_needing_attention: number;
  total_notified: number;
  total_responded: number;
  response_rate: number;
}

/**
 * Eligible instructor for assignment modal.
 * Returned by get_eligible_instructors RPC.
 */
export interface EligibleInstructor {
  instructor_id: string;
  full_name: string;
  email: string;
  firm_state: string | null;
  tier: number;
  reason: string;
}

/**
 * Program block for assignment modal.
 * Individual teaching slots within a scheduled program.
 */
export interface ProgramBlock {
  id: string;
  block_name: string;
  sequence_order: number;
  start_date: string;
  end_date: string | null;
  status: 'open' | 'claimed' | 'confirmed' | 'completed';
  instructor_id: string | null;
  instructor_name: string | null;
}

/**
 * Full dashboard data bundle.
 * Returned by getFacultySchedulerDashboardData for parallel fetching.
 */
export interface FacultySchedulerDashboardData {
  programs: RecruitmentPipelineProgram[];
  notResponded: NotRespondedInstructor[];
  summaryStats: DashboardSummaryStats;
}

// ============================================
// Query Functions
// ============================================

/**
 * Fetch recruitment pipeline from dashboard view.
 * Includes notification counts, response tracking, and tier status.
 */
export async function getRecruitmentPipeline(): Promise<RecruitmentPipelineProgram[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('faculty_scheduler.dashboard_recruitment_pipeline')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching recruitment pipeline:', error);
    return [];
  }

  return (data || []) as RecruitmentPipelineProgram[];
}

/**
 * Fetch instructors who haven't responded to notifications.
 * Limited to 50 records for dashboard performance.
 */
export async function getNotRespondedInstructors(): Promise<NotRespondedInstructor[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('faculty_scheduler.not_responded_instructors')
    .select('*')
    .limit(50);

  if (error) {
    console.error('Error fetching not responded instructors:', error);
    return [];
  }

  return (data || []) as NotRespondedInstructor[];
}

/**
 * Fetch summary stats for dashboard cards.
 * Returns a single row with aggregated totals.
 */
export async function getDashboardSummaryStats(): Promise<DashboardSummaryStats> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('faculty_scheduler.dashboard_summary_stats')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching dashboard summary stats:', error);
    return {
      total_programs: 0,
      awaiting_tier_0: 0,
      awaiting_tier_1: 0,
      open_programs: 0,
      filled_programs: 0,
      draft_programs: 0,
      programs_needing_attention: 0,
      total_notified: 0,
      total_responded: 0,
      response_rate: 0,
    };
  }

  return data as DashboardSummaryStats;
}

/**
 * Fetch instructors eligible to claim a specific program.
 * Calls the get_eligible_instructors RPC function which respects tier rules.
 */
export async function getEligibleInstructors(
  scheduledProgramId: string
): Promise<EligibleInstructor[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc(
    'faculty_scheduler.get_eligible_instructors',
    { p_scheduled_program_id: scheduledProgramId }
  );

  if (error) {
    console.error('Error fetching eligible instructors:', error);
    return [];
  }

  return (data || []) as EligibleInstructor[];
}

/**
 * Fetch program blocks with instructor names for assignment modal.
 * Includes both open and claimed blocks.
 */
export async function getProgramBlocks(
  scheduledProgramId: string
): Promise<ProgramBlock[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('faculty_scheduler.program_blocks')
    .select(`
      id,
      block_name,
      sequence_order,
      start_date,
      end_date,
      status,
      instructor_id,
      instructor:instructor_id (full_name)
    `)
    .eq('scheduled_program_id', scheduledProgramId)
    .order('sequence_order', { ascending: true });

  if (error) {
    console.error('Error fetching program blocks:', error);
    return [];
  }

  return (data || []).map((block) => ({
    id: block.id,
    block_name: block.block_name,
    sequence_order: block.sequence_order,
    start_date: block.start_date,
    end_date: block.end_date,
    status: block.status,
    instructor_id: block.instructor_id,
    instructor_name: (block.instructor as { full_name: string } | null)?.full_name || null,
  })) as ProgramBlock[];
}

// ============================================
// Main Dashboard Data Fetcher
// ============================================

/**
 * Fetch all Faculty Scheduler dashboard data in parallel.
 * Returns programs, not-responded list, and summary stats.
 */
export async function getFacultySchedulerDashboardData(): Promise<FacultySchedulerDashboardData> {
  const [programs, notResponded, summaryStats] = await Promise.all([
    getRecruitmentPipeline(),
    getNotRespondedInstructors(),
    getDashboardSummaryStats(),
  ]);

  return {
    programs,
    notResponded,
    summaryStats,
  };
}
