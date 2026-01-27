import { createServerClient } from '@/lib/supabase/server';
import type {
  PlanningProject,
  PlanningProjectSummary,
  PlanningPhase,
  PlanningConversation,
  PlanningDocument,
  PlanningResearch,
  PlanningMemory,
  UserGoal,
  PlanningDashboardData,
  ProjectStatus,
} from '@/dashboard-kit/types/departments/planning';

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
 * Fetch the ready-to-build queue sorted by priority
 */
export async function getReadyToBuildQueue(): Promise<PlanningProjectSummary[]> {
  const projects = await getProjectsByStatus('ready_to_build');
  return projects.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
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
