import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  DevProject,
  DevProjectPhase,
  DevProjectIdea,
  DevProjectSummary,
  DevProjectNeedingAttention,
  DevelopmentDashboardData,
} from '@/dashboard-kit/types/departments/development';

/**
 * Fetch all dev projects summary
 */
export async function getDevProjects(): Promise<DevProjectSummary[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_project_summary')
    .select('*')
    .order('status');

  if (error) {
    console.error('Error fetching dev projects:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch projects needing attention
 */
export async function getProjectsNeedingAttention(): Promise<DevProjectNeedingAttention[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_projects_needing_attention')
    .select('*');

  if (error) {
    console.error('Error fetching projects needing attention:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch a single project by key
 */
export async function getDevProject(projectKey: string): Promise<DevProject | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_projects')
    .select('*')
    .eq('project_key', projectKey)
    .single();

  if (error) {
    console.error('Error fetching dev project:', error);
    return null;
  }

  return data;
}

/**
 * Fetch phases for a project
 */
export async function getProjectPhases(projectId: string): Promise<DevProjectPhase[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('phase_number');

  if (error) {
    console.error('Error fetching project phases:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch phases for multiple projects
 */
export async function getAllProjectPhases(): Promise<Record<string, DevProjectPhase[]>> {
  const supabase = await createServerSupabaseClient();

  // Get all projects first to map IDs to keys
  const { data: projects, error: projectsError } = await supabase
    .from('dev_projects')
    .select('id, project_key');

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return {};
  }

  // Get all phases
  const { data: phases, error: phasesError } = await supabase
    .from('dev_project_phases')
    .select('*')
    .order('phase_number');

  if (phasesError) {
    console.error('Error fetching phases:', phasesError);
    return {};
  }

  // Create lookup map
  const projectKeyById: Record<string, string> = {};
  for (const p of projects || []) {
    projectKeyById[p.id] = p.project_key;
  }

  // Group phases by project key
  const phasesByProject: Record<string, DevProjectPhase[]> = {};
  for (const phase of phases || []) {
    const key = projectKeyById[phase.project_id];
    if (key) {
      if (!phasesByProject[key]) {
        phasesByProject[key] = [];
      }
      phasesByProject[key].push(phase);
    }
  }

  return phasesByProject;
}

/**
 * Fetch ideas for a project
 */
export async function getProjectIdeas(projectId: string): Promise<DevProjectIdea[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_project_ideas')
    .select('*')
    .eq('project_id', projectId)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching project ideas:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch all ideas grouped by project
 */
export async function getAllProjectIdeas(): Promise<Record<string, DevProjectIdea[]>> {
  const supabase = await createServerSupabaseClient();

  // Get all projects first to map IDs to keys
  const { data: projects, error: projectsError } = await supabase
    .from('dev_projects')
    .select('id, project_key');

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return {};
  }

  // Get all ideas
  const { data: ideas, error: ideasError } = await supabase
    .from('dev_project_ideas')
    .select('*')
    .eq('status', 'captured')
    .order('priority', { ascending: false });

  if (ideasError) {
    console.error('Error fetching ideas:', ideasError);
    return {};
  }

  // Create lookup map
  const projectKeyById: Record<string, string> = {};
  for (const p of projects || []) {
    projectKeyById[p.id] = p.project_key;
  }

  // Group ideas by project key
  const ideasByProject: Record<string, DevProjectIdea[]> = {};
  for (const idea of ideas || []) {
    const key = projectKeyById[idea.project_id];
    if (key) {
      if (!ideasByProject[key]) {
        ideasByProject[key] = [];
      }
      ideasByProject[key].push(idea);
    }
  }

  return ideasByProject;
}

/**
 * Fetch complete dashboard data
 */
export async function getDevelopmentDashboardData(): Promise<DevelopmentDashboardData> {
  const [projects, projectsNeedingAttention, phases, ideas] = await Promise.all([
    getDevProjects(),
    getProjectsNeedingAttention(),
    getAllProjectPhases(),
    getAllProjectIdeas(),
  ]);

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status !== 'complete').length,
    projectsNeedingInput: projects.filter(p => p.status === 'needs_input').length,
    blockedProjects: projects.filter(p => p.status === 'blocked').length,
    totalIdeas: Object.values(ideas).flat().length,
  };

  return {
    projects,
    projectsNeedingAttention,
    phases,
    ideas,
    stats,
  };
}

/**
 * Create a new idea
 */
export async function createIdea(
  projectId: string,
  title: string,
  description?: string,
  targetMilestone?: string,
  priority?: number
): Promise<DevProjectIdea | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_project_ideas')
    .insert({
      project_id: projectId,
      title,
      description,
      target_milestone: targetMilestone,
      priority: priority || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating idea:', error);
    return null;
  }

  return data;
}

/**
 * Update an idea
 */
export async function updateIdea(
  ideaId: string,
  updates: Partial<Pick<DevProjectIdea, 'title' | 'description' | 'target_milestone' | 'priority' | 'status'>>
): Promise<DevProjectIdea | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('dev_project_ideas')
    .update(updates)
    .eq('id', ideaId)
    .select()
    .single();

  if (error) {
    console.error('Error updating idea:', error);
    return null;
  }

  return data;
}

/**
 * Delete an idea
 */
export async function deleteIdea(ideaId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('dev_project_ideas')
    .delete()
    .eq('id', ideaId);

  if (error) {
    console.error('Error deleting idea:', error);
    return false;
  }

  return true;
}

/**
 * Update project status (for GSD integration)
 */
export async function updateProjectStatus(
  projectKey: string,
  status: string,
  activityDescription?: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc('update_dev_project_status', {
    p_project_key: projectKey,
    p_status: status,
    p_activity_description: activityDescription,
  });

  if (error) {
    console.error('Error updating project status:', error);
    return false;
  }

  return true;
}
