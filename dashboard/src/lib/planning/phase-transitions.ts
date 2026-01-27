// Planning Studio Phase Transitions
// Backend logic for phase completion, incubation enforcement, and navigation

import { createServerClient } from '@/lib/supabase/server';
import type { PhaseType } from '@/dashboard-kit/types/departments/planning';
import { PHASE_ORDER } from '@/dashboard-kit/types/departments/planning';

// =============================================================================
// MARKER CONSTANTS
// =============================================================================

export const PHASE_COMPLETE_MARKER = '<!--PHASE_COMPLETE-->';
export const READINESS_PASS_MARKER = '<!--READINESS_PASS-->';
export const READINESS_FAIL_MARKER_PREFIX = '<!--READINESS_FAIL:';

// =============================================================================
// MARKER DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if content contains the phase completion marker
 */
export function detectCompletionMarker(content: string): boolean {
  return content.includes(PHASE_COMPLETE_MARKER);
}

/**
 * Check if content contains a readiness marker.
 * Returns null if no marker found, { passed: true } or { passed: false, reason } if found.
 */
export function detectReadinessMarker(content: string): { passed: boolean; reason?: string } | null {
  if (content.includes(READINESS_PASS_MARKER)) {
    return { passed: true };
  }

  const failIdx = content.indexOf(READINESS_FAIL_MARKER_PREFIX);
  if (failIdx !== -1) {
    const startIdx = failIdx + READINESS_FAIL_MARKER_PREFIX.length;
    const endIdx = content.indexOf('-->', startIdx);
    if (endIdx !== -1) {
      const reason = content.substring(startIdx, endIdx).trim();
      return { passed: false, reason };
    }
    return { passed: false, reason: 'Unknown reason' };
  }

  return null;
}

/**
 * Remove all markers from content for display/storage
 */
export function stripMarkers(content: string): string {
  let stripped = content;

  // Remove completion marker
  stripped = stripped.replace(PHASE_COMPLETE_MARKER, '');

  // Remove readiness pass marker
  stripped = stripped.replace(READINESS_PASS_MARKER, '');

  // Remove readiness fail markers (with reason)
  stripped = stripped.replace(/<!--READINESS_FAIL:.*?-->/g, '');

  // Clean up extra whitespace from removal
  stripped = stripped.replace(/\n{3,}/g, '\n\n').trim();

  return stripped;
}

// =============================================================================
// INCUBATION DURATIONS (hours)
// =============================================================================

export const INCUBATION_DURATIONS: Record<PhaseType, number> = {
  capture: 24,
  discover: 36,
  define: 0,
  develop: 24,
  validate: 0,
  package: 0,
};

// =============================================================================
// READINESS CHECK TRANSITIONS
// =============================================================================

export const READINESS_CHECK_TRANSITIONS: Array<{ from: PhaseType; to: PhaseType }> = [
  { from: 'discover', to: 'define' },
  { from: 'develop', to: 'validate' },
];

/**
 * Check if the current phase requires a readiness check before advancing
 */
export function requiresReadinessCheck(currentPhase: PhaseType): boolean {
  return READINESS_CHECK_TRANSITIONS.some((t) => t.from === currentPhase);
}

// =============================================================================
// CORE TRANSITION FUNCTIONS
// =============================================================================

/**
 * Complete a phase and advance to the next one.
 * Sets incubation if applicable.
 */
export async function completePhase(
  projectId: string,
  phaseType: PhaseType
): Promise<{ success: boolean; error?: string; nextPhase?: PhaseType; incubationEndsAt?: string }> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Update phase record to complete
    const { error: phaseError } = await supabase
      .schema('planning_studio')
      .from('phases')
      .update({ status: 'complete', completed_at: now })
      .eq('project_id', projectId)
      .eq('phase_type', phaseType);

    if (phaseError) throw phaseError;

    // Determine next phase
    const currentIdx = PHASE_ORDER.indexOf(phaseType);
    const nextPhase = currentIdx < PHASE_ORDER.length - 1 ? PHASE_ORDER[currentIdx + 1] : undefined;

    // Calculate incubation
    const incubationHours = INCUBATION_DURATIONS[phaseType];
    let incubationEndsAt: string | undefined;

    if (incubationHours > 0) {
      const endsAt = new Date(Date.now() + incubationHours * 60 * 60 * 1000);
      incubationEndsAt = endsAt.toISOString();

      // Set incubation on the completed phase record
      await supabase
        .schema('planning_studio')
        .from('phases')
        .update({ incubation_ends_at: incubationEndsAt })
        .eq('project_id', projectId)
        .eq('phase_type', phaseType);

      // Lock the project
      await supabase
        .schema('planning_studio')
        .from('projects')
        .update({ phase_locked_until: incubationEndsAt, updated_at: now })
        .eq('id', projectId);
    }

    // Advance to next phase
    if (nextPhase) {
      // Check if next phase record exists
      const { data: existingPhase } = await supabase
        .schema('planning_studio')
        .from('phases')
        .select('id')
        .eq('project_id', projectId)
        .eq('phase_type', nextPhase)
        .single();

      if (existingPhase) {
        await supabase
          .schema('planning_studio')
          .from('phases')
          .update({ status: 'in_progress', started_at: now })
          .eq('project_id', projectId)
          .eq('phase_type', nextPhase);
      } else {
        await supabase
          .schema('planning_studio')
          .from('phases')
          .insert({
            project_id: projectId,
            phase_type: nextPhase,
            status: 'in_progress',
            started_at: now,
          });
      }

      // Update project current_phase
      await supabase
        .schema('planning_studio')
        .from('projects')
        .update({ current_phase: nextPhase, updated_at: now })
        .eq('id', projectId);
    }

    return { success: true, nextPhase, incubationEndsAt };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete phase',
    };
  }
}

/**
 * Skip incubation for a project, clearing the lock.
 */
export async function skipIncubation(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Clear project lock and mark skipped
    const { error: projectError } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({
        phase_locked_until: null,
        incubation_skipped: true,
        updated_at: now,
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Clear incubation_ends_at on any incubating phase
    await supabase
      .schema('planning_studio')
      .from('phases')
      .update({ incubation_ends_at: null })
      .eq('project_id', projectId)
      .not('incubation_ends_at', 'is', null);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip incubation',
    };
  }
}

/**
 * Navigate to a specific phase without re-incubating.
 */
export async function navigateToPhase(
  projectId: string,
  targetPhase: PhaseType
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Check if target phase record exists
    const { data: existingPhase } = await supabase
      .schema('planning_studio')
      .from('phases')
      .select('id')
      .eq('project_id', projectId)
      .eq('phase_type', targetPhase)
      .single();

    if (!existingPhase) {
      await supabase
        .schema('planning_studio')
        .from('phases')
        .insert({
          project_id: projectId,
          phase_type: targetPhase,
          status: 'in_progress',
          started_at: now,
        });
    } else {
      // Update existing phase to in_progress if not already complete
      await supabase
        .schema('planning_studio')
        .from('phases')
        .update({ status: 'in_progress', started_at: now })
        .eq('project_id', projectId)
        .eq('phase_type', targetPhase)
        .in('status', ['not_started']);
    }

    // Update project current_phase
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({ current_phase: targetPhase, updated_at: now })
      .eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to navigate to phase',
    };
  }
}

/**
 * Ensure all 6 phase records exist for a project.
 * Creates missing ones with status 'not_started'.
 */
export async function ensureAllPhasesExist(projectId: string): Promise<void> {
  const supabase = createServerClient();

  // Get existing phases
  const { data: existingPhases } = await supabase
    .schema('planning_studio')
    .from('phases')
    .select('phase_type')
    .eq('project_id', projectId);

  const existingTypes = new Set((existingPhases || []).map((p) => p.phase_type));

  // Insert missing phases
  const missingPhases = PHASE_ORDER.filter((pt) => !existingTypes.has(pt));

  if (missingPhases.length > 0) {
    const records = missingPhases.map((phase_type, idx) => ({
      project_id: projectId,
      phase_type,
      status: idx === 0 && !existingTypes.has('capture') ? 'in_progress' : 'not_started',
      started_at: idx === 0 && !existingTypes.has('capture') ? new Date().toISOString() : null,
    }));

    await supabase
      .schema('planning_studio')
      .from('phases')
      .insert(records);
  }
}
