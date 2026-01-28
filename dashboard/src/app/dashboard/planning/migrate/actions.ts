'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Old project from dev_projects table
 */
export interface OldProject {
  id: string;
  project_key: string;
  project_name: string;
  description: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

/**
 * Result of a single project migration
 */
export interface MigrationResult {
  oldProjectId: string;
  success: boolean;
  newProjectId?: string;
  error?: string;
}

/**
 * Status mapping from dev_projects to Planning Studio
 * - idle: Project not started -> idea status, capture phase
 * - executing: In progress -> planning status, discover phase
 * - needs_input: Waiting on user -> planning status, discover phase
 * - blocked: Stuck -> planning status, discover phase
 * - complete: Done -> shipped status, package phase
 */
const STATUS_MAP: Record<string, { status: string; phase: string }> = {
  'idle': { status: 'idea', phase: 'capture' },
  'executing': { status: 'planning', phase: 'discover' },
  'needs_input': { status: 'planning', phase: 'discover' },
  'blocked': { status: 'planning', phase: 'discover' },
  'complete': { status: 'shipped', phase: 'package' },
};

/**
 * Fetch all projects from the old dev_projects table
 */
export async function getOldProjects(): Promise<OldProject[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('dev_projects')
    .select('id, project_key, project_name, description, status, created_at, completed_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching old projects:', error);
    return [];
  }

  return (data || []) as OldProject[];
}

/**
 * Migrate a single project from dev_projects to planning_studio.projects
 */
export async function migrateProject(oldProjectId: string): Promise<MigrationResult> {
  const supabase = createServerClient();

  // Fetch old project data
  const { data: oldProject, error: fetchError } = await supabase
    .from('dev_projects')
    .select('*')
    .eq('id', oldProjectId)
    .single();

  if (fetchError || !oldProject) {
    return {
      oldProjectId,
      success: false,
      error: fetchError?.message || 'Project not found'
    };
  }

  // Map status to Planning Studio equivalent
  const mapped = STATUS_MAP[oldProject.status] || { status: 'idea', phase: 'capture' };

  // Create new project in planning_studio schema
  const { data: newProject, error: createError } = await supabase
    .schema('planning_studio')
    .from('projects')
    .insert({
      title: oldProject.project_name,
      one_liner: oldProject.description,
      status: mapped.status,
      current_phase: mapped.phase,
      created_at: oldProject.created_at,
      shipped_at: oldProject.status === 'complete' ? oldProject.completed_at : null,
    })
    .select()
    .single();

  if (createError) {
    return {
      oldProjectId,
      success: false,
      error: createError.message
    };
  }

  // Create initial phase record for the current phase
  const { error: phaseError } = await supabase
    .schema('planning_studio')
    .from('phases')
    .insert({
      project_id: newProject.id,
      phase_type: mapped.phase,
      status: mapped.status === 'shipped' ? 'complete' : 'in_progress',
    });

  if (phaseError) {
    console.error('Error creating initial phase:', phaseError);
    // Don't fail the migration for phase creation error
  }

  revalidatePath('/dashboard/planning');

  return {
    oldProjectId,
    success: true,
    newProjectId: newProject.id
  };
}

/**
 * Migrate multiple projects at once
 */
export async function migrateMultipleProjects(
  projectIds: string[]
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const projectId of projectIds) {
    const result = await migrateProject(projectId);
    results.push(result);
  }

  return results;
}
