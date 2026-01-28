import { createServerClient } from '@/lib/supabase/server';
import type {
  PlanningProject,
  PlanningProjectSummary,
  PlanningPhase,
  PlanningConversation,
  PlanningDocument,
  PlanningResearch,
  PlanningMemory,
  PlanningMessage,
  UserGoal,
  PlanningDashboardData,
  ProjectStatus,
  QueueProject,
} from '@/dashboard-kit/types/departments/planning';

// Analytics types
export type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'all';

export interface AnalyticsMetrics {
  shippedCount: number;
  avgVelocityDays: number | null;
  capturedCount: number;
  trendData: Array<{ date: string; shipped: number; captured: number }>;
}

export interface FunnelDataItem {
  name: string;
  value: number;
}

// Note: planning_studio is a separate schema. Supabase client may require
// schema-qualified names or RPC functions for access. If direct table access
// doesn't work, use the RPC pattern with get_project_summary, search_memories, etc.

/**
 * Fetch all planning projects with summary data
 */
export async function getPlanningProjects(): Promise<PlanningProjectSummary[]> {
  const supabase = createServerClient();

  // Use RPC to get project summaries with computed fields
  // This calls get_project_summary for each project efficiently
  const { data: projects, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching planning projects:', error);
    return [];
  }

  // Fetch phase counts for each project
  const { data: phases } = await supabase
    .schema('planning_studio')
    .from('phases')
    .select('project_id, status');

  const { data: conversations } = await supabase
    .schema('planning_studio')
    .from('conversations')
    .select('project_id');

  const { data: memories } = await supabase
    .schema('planning_studio')
    .from('memories')
    .select('project_id');

  const { data: documents } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('project_id');

  // Build lookup maps
  const phaseCounts: Record<string, { completed: number; total: number }> = {};
  const conversationCounts: Record<string, number> = {};
  const memoryCounts: Record<string, number> = {};
  const documentCounts: Record<string, number> = {};

  for (const phase of phases || []) {
    if (!phaseCounts[phase.project_id]) {
      phaseCounts[phase.project_id] = { completed: 0, total: 0 };
    }
    phaseCounts[phase.project_id].total++;
    if (phase.status === 'complete') {
      phaseCounts[phase.project_id].completed++;
    }
  }

  for (const conv of conversations || []) {
    conversationCounts[conv.project_id] = (conversationCounts[conv.project_id] || 0) + 1;
  }

  for (const mem of memories || []) {
    memoryCounts[mem.project_id] = (memoryCounts[mem.project_id] || 0) + 1;
  }

  for (const doc of documents || []) {
    documentCounts[doc.project_id] = (documentCounts[doc.project_id] || 0) + 1;
  }

  // Map to summary type
  return (projects || []).map((p): PlanningProjectSummary => ({
    id: p.id,
    title: p.title,
    one_liner: p.one_liner,
    status: p.status as ProjectStatus,
    current_phase: p.current_phase,
    phase_locked_until: p.phase_locked_until,
    priority_score: p.priority_score,
    phases_completed: phaseCounts[p.id]?.completed || 0,
    total_phases: phaseCounts[p.id]?.total || 6, // Default to 6 if not created yet
    conversation_count: conversationCounts[p.id] || 0,
    memory_count: memoryCounts[p.id] || 0,
    document_count: documentCounts[p.id] || 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
    // Build fields
    build_phase: p.build_phase,
    build_total_phases: p.build_total_phases,
    build_progress_percent: p.build_progress_percent,
    build_started_at: p.build_started_at,
    // Shipped field
    shipped_at: p.shipped_at,
  }));
}

/**
 * Fetch a single project by ID with full details
 */
export async function getPlanningProject(projectId: string): Promise<PlanningProject | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching planning project:', error);
    return null;
  }

  return data as PlanningProject;
}

/**
 * Fetch phases for a project
 */
export async function getProjectPhases(projectId: string): Promise<PlanningPhase[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('phases')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at');

  if (error) {
    console.error('Error fetching project phases:', error);
    return [];
  }

  return (data || []) as PlanningPhase[];
}

/**
 * Fetch conversations for a project, optionally filtered by phase
 */
export async function getProjectConversations(
  projectId: string,
  phaseId?: string
): Promise<PlanningConversation[]> {
  const supabase = createServerClient();

  let query = supabase
    .schema('planning_studio')
    .from('conversations')
    .select('*')
    .eq('project_id', projectId)
    .order('started_at', { ascending: false });

  if (phaseId) {
    query = query.eq('phase_id', phaseId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching project conversations:', error);
    return [];
  }

  return (data || []) as PlanningConversation[];
}

/**
 * Fetch documents for a project
 */
export async function getProjectDocuments(projectId: string): Promise<PlanningDocument[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching project documents:', error);
    return [];
  }

  return (data || []) as PlanningDocument[];
}

/**
 * Fetch research runs for a project
 */
export async function getProjectResearch(projectId: string): Promise<PlanningResearch[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('research')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project research:', error);
    return [];
  }

  return (data || []) as PlanningResearch[];
}

/**
 * Fetch memories for a project
 */
export async function getProjectMemories(projectId: string): Promise<PlanningMemory[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('memories')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project memories:', error);
    return [];
  }

  // Exclude embedding field from return (large binary data)
  return (data || []).map((m): PlanningMemory => ({
    ...m,
    embedding: null, // Don't return embeddings to client
  }));
}

/**
 * Fetch user goals
 */
export async function getUserGoals(): Promise<UserGoal[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('user_goals')
    .select('*')
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching user goals:', error);
    return [];
  }

  return (data || []) as UserGoal[];
}

/**
 * Fetch all goals ordered by priority DESC, created_at ASC
 */
export async function getGoals(): Promise<UserGoal[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('user_goals')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }

  return (data || []) as UserGoal[];
}

/**
 * Fetch only active goals
 */
export async function getActiveGoals(): Promise<UserGoal[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('user_goals')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active goals:', error);
    return [];
  }

  return (data || []) as UserGoal[];
}

/**
 * Fetch complete dashboard data for the Planning Studio main view
 */
export async function getPlanningDashboardData(): Promise<PlanningDashboardData> {
  const [projects, goals] = await Promise.all([
    getPlanningProjects(),
    getUserGoals(),
  ]);

  // Group projects by status
  const projectsByStatus: Record<ProjectStatus, PlanningProjectSummary[]> = {
    idea: [],
    planning: [],
    ready_to_build: [],
    building: [],
    shipped: [],
    archived: [],
  };

  for (const project of projects) {
    projectsByStatus[project.status].push(project);
  }

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    ideasCount: projectsByStatus.idea.length,
    planningCount: projectsByStatus.planning.length,
    readyToBuildCount: projectsByStatus.ready_to_build.length,
    buildingCount: projectsByStatus.building.length,
    shippedCount: projectsByStatus.shipped.length,
    activeGoalsCount: goals.filter(g => g.active).length,
  };

  return {
    projects,
    projectsByStatus,
    goals,
    stats,
  };
}

/**
 * Fetch projects by status
 */
export async function getProjectsByStatus(status: ProjectStatus): Promise<PlanningProjectSummary[]> {
  const projects = await getPlanningProjects();
  return projects.filter(p => p.status === status);
}

/**
 * Fetch the ready-to-build queue sorted by pinned first, then priority score
 */
export async function getReadyToBuildQueue(): Promise<QueueProject[]> {
  const supabase = createServerClient();

  // Fetch ready_to_build projects with pinned and priority_reasoning
  const { data: projects, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('*')
    .eq('status', 'ready_to_build')
    .order('pinned', { ascending: false, nullsFirst: false })
    .order('priority_score', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching ready-to-build queue:', error);
    return [];
  }

  // Fetch document counts for these projects
  const projectIds = (projects || []).map(p => p.id);
  const { data: documents } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('project_id')
    .in('project_id', projectIds.length > 0 ? projectIds : ['__none__']);

  const documentCounts: Record<string, number> = {};
  for (const doc of documents || []) {
    documentCounts[doc.project_id] = (documentCounts[doc.project_id] || 0) + 1;
  }

  return (projects || []).map((p): QueueProject => ({
    id: p.id,
    title: p.title,
    one_liner: p.one_liner,
    status: p.status as ProjectStatus,
    current_phase: p.current_phase,
    phase_locked_until: p.phase_locked_until,
    priority_score: p.priority_score,
    phases_completed: 6, // ready_to_build means all phases done
    total_phases: 6,
    conversation_count: 0,
    memory_count: 0,
    document_count: documentCounts[p.id] || 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
    pinned: p.pinned || false,
    priority_reasoning: p.priority_reasoning,
  }));
}

/**
 * Get project counts by status for empty state display
 */
export async function getProjectCountsByStatus(): Promise<Record<ProjectStatus, number>> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('status');

  const counts: Record<ProjectStatus, number> = {
    idea: 0,
    planning: 0,
    ready_to_build: 0,
    building: 0,
    shipped: 0,
    archived: 0,
  };

  if (error) {
    console.error('Error fetching project counts:', error);
    return counts;
  }

  for (const p of data || []) {
    const status = p.status as ProjectStatus;
    if (status in counts) {
      counts[status]++;
    }
  }

  return counts;
}

/**
 * Client-side fetch: get all research for a project via API route
 */
export async function fetchProjectResearch(projectId: string): Promise<PlanningResearch[]> {
  const res = await fetch(`/api/planning/research?projectId=${encodeURIComponent(projectId)}`);
  if (!res.ok) {
    console.error('Error fetching research:', res.statusText);
    return [];
  }
  return res.json();
}

/**
 * Search memories using semantic similarity (via RPC)
 * Note: Requires embedding vector - call from server-side only with embedding API
 */
export async function searchMemories(
  queryEmbedding: number[],
  matchCount: number = 10,
  filterProjectId?: string,
  filterMemoryType?: string
): Promise<PlanningMemory[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .rpc('search_memories', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_project_id: filterProjectId || null,
      filter_memory_type: filterMemoryType || null,
    });

  if (error) {
    console.error('Error searching memories:', error);
    return [];
  }

  return (data || []) as PlanningMemory[];
}

/**
 * Fetch all messages for a conversation ordered by created_at ascending
 */
export async function getConversationMessages(conversationId: string): Promise<PlanningMessage[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }

  return (data || []) as PlanningMessage[];
}

/**
 * Get a phase by project ID and phase type
 */
export async function getPhaseByType(
  projectId: string,
  phaseType: string
): Promise<PlanningPhase | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('phases')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase_type', phaseType)
    .single();

  if (error) {
    console.error('Error fetching phase by type:', error);
    return null;
  }

  return data as PlanningPhase;
}

/**
 * Get phase context for AI conversations (via RPC)
 */
export async function getPhaseContext(
  projectId: string,
  phaseType: string
): Promise<{
  conversation_summaries: string[];
  document_contents: Array<{ type: string; content: string; version: number }>;
  recent_messages: Array<{ role: string; content: string; created_at: string }>;
} | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .schema('planning_studio')
    .rpc('get_phase_context', {
      p_project_id: projectId,
      p_phase_type: phaseType,
    });

  if (error) {
    console.error('Error getting phase context:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Get period start date for analytics queries
 */
function getPeriodStartDate(period: AnalyticsPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

/**
 * Generate date buckets for trend data
 */
function generateDateBuckets(
  period: AnalyticsPeriod,
  startDate: Date | null
): string[] {
  const now = new Date();
  const buckets: string[] = [];

  if (period === 'week') {
    // Daily buckets for week
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      buckets.push(d.toISOString().split('T')[0]);
    }
  } else if (period === 'month' || period === 'quarter') {
    // Weekly buckets for month/quarter
    const weeks = period === 'month' ? 4 : 12;
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      buckets.push(d.toISOString().split('T')[0]);
    }
  } else {
    // Monthly buckets for all time (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push(d.toISOString().split('T')[0].slice(0, 7));
    }
  }

  return buckets;
}

/**
 * Get a date key for bucketing
 */
function getDateKey(dateStr: string, period: AnalyticsPeriod): string {
  const date = new Date(dateStr);
  if (period === 'week') {
    return date.toISOString().split('T')[0];
  } else if (period === 'month' || period === 'quarter') {
    // Round to start of week (Sunday)
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    return startOfWeek.toISOString().split('T')[0];
  } else {
    // Monthly bucket
    return date.toISOString().split('T')[0].slice(0, 7);
  }
}

/**
 * Fetch analytics metrics for a given period
 */
export async function getAnalyticsMetrics(
  period: AnalyticsPeriod
): Promise<AnalyticsMetrics> {
  const supabase = createServerClient();
  const startDate = getPeriodStartDate(period);
  const startDateStr = startDate ? startDate.toISOString() : null;

  // Fetch all projects (we'll filter in JS for flexibility)
  const { data: projects, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('id, status, created_at, shipped_at');

  if (error) {
    console.error('Error fetching analytics metrics:', error);
    return {
      shippedCount: 0,
      avgVelocityDays: null,
      capturedCount: 0,
      trendData: [],
    };
  }

  const allProjects = projects || [];

  // Filter projects by period
  const projectsInPeriod = startDateStr
    ? allProjects.filter((p) => {
        const created = new Date(p.created_at);
        const shipped = p.shipped_at ? new Date(p.shipped_at) : null;
        return (
          created >= new Date(startDateStr) ||
          (shipped && shipped >= new Date(startDateStr))
        );
      })
    : allProjects;

  // Calculate shipped count in period
  const shippedInPeriod = startDateStr
    ? allProjects.filter(
        (p) =>
          p.shipped_at &&
          new Date(p.shipped_at) >= new Date(startDateStr)
      )
    : allProjects.filter((p) => p.shipped_at);

  const shippedCount = shippedInPeriod.length;

  // Calculate captured count in period
  const capturedInPeriod = startDateStr
    ? allProjects.filter(
        (p) => new Date(p.created_at) >= new Date(startDateStr)
      )
    : allProjects;

  const capturedCount = capturedInPeriod.length;

  // Calculate average velocity (shipped_at - created_at) for shipped projects
  let avgVelocityDays: number | null = null;
  if (shippedInPeriod.length > 0) {
    const velocities = shippedInPeriod.map((p) => {
      const created = new Date(p.created_at).getTime();
      const shipped = new Date(p.shipped_at!).getTime();
      return (shipped - created) / (1000 * 60 * 60 * 24);
    });
    const totalDays = velocities.reduce((sum, v) => sum + v, 0);
    avgVelocityDays = Math.round((totalDays / velocities.length) * 10) / 10;
  }

  // Generate trend data
  const buckets = generateDateBuckets(period, startDate);
  const shippedByBucket: Record<string, number> = {};
  const capturedByBucket: Record<string, number> = {};

  for (const bucket of buckets) {
    shippedByBucket[bucket] = 0;
    capturedByBucket[bucket] = 0;
  }

  for (const p of allProjects) {
    const createdKey = getDateKey(p.created_at, period);
    if (createdKey in capturedByBucket) {
      capturedByBucket[createdKey]++;
    }

    if (p.shipped_at) {
      const shippedKey = getDateKey(p.shipped_at, period);
      if (shippedKey in shippedByBucket) {
        shippedByBucket[shippedKey]++;
      }
    }
  }

  const trendData = buckets.map((bucket) => ({
    date: bucket,
    shipped: shippedByBucket[bucket] || 0,
    captured: capturedByBucket[bucket] || 0,
  }));

  return {
    shippedCount,
    avgVelocityDays,
    capturedCount,
    trendData,
  };
}

/**
 * Fetch funnel data showing project counts by status
 */
export async function getFunnelData(): Promise<FunnelDataItem[]> {
  const supabase = createServerClient();

  const { data: projects, error } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('status')
    .neq('status', 'archived');

  if (error) {
    console.error('Error fetching funnel data:', error);
    return [];
  }

  // Count by status
  const counts: Record<string, number> = {
    idea: 0,
    planning: 0,
    ready_to_build: 0,
    building: 0,
    shipped: 0,
  };

  for (const p of projects || []) {
    if (p.status in counts) {
      counts[p.status]++;
    }
  }

  // Return in funnel order with display names
  return [
    { name: 'Idea', value: counts.idea },
    { name: 'Planning', value: counts.planning },
    { name: 'Ready to Build', value: counts.ready_to_build },
    { name: 'Building', value: counts.building },
    { name: 'Shipped', value: counts.shipped },
  ];
}
