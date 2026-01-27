// Planning Studio Department types
// AI-guided idea-to-production pipeline with incubation periods and semantic memory

// =============================================================================
// STATUS AND TYPE ENUMS
// =============================================================================

export type ProjectStatus = 'idea' | 'planning' | 'ready_to_build' | 'building' | 'shipped' | 'archived';
export type PhaseType = 'capture' | 'discover' | 'define' | 'develop' | 'validate' | 'package';
export type PhaseStatus = 'not_started' | 'in_progress' | 'incubating' | 'complete';
export type ResearchType = 'icp_deep_dive' | 'competitive_analysis' | 'market_research' | 'user_workflows' | 'technical_feasibility' | 'custom';
export type ResearchStatus = 'pending' | 'running' | 'complete' | 'failed';
export type DocumentType = 'icp' | 'competitive_intel' | 'lean_canvas' | 'problem_statement' | 'feature_spec' | 'technical_scope' | 'gsd_project' | 'gsd_requirements' | 'gsd_roadmap';
export type MemoryType = 'decision' | 'inspiration' | 'insight' | 'pivot' | 'research_finding' | 'constraint' | 'user_preference' | 'rejection_reason';
export type GoalType = 'revenue' | 'learning' | 'strategic' | 'quick_win' | 'passion';
export type MessageRole = 'user' | 'assistant';

// =============================================================================
// ENTITY INTERFACES
// =============================================================================

export interface PlanningProject {
  id: string;
  title: string;
  one_liner?: string;
  status: ProjectStatus;
  current_phase: PhaseType;
  phase_locked_until?: string;
  incubation_skipped: boolean;
  priority_score?: number;
  priority_reasoning?: string;
  priority_updated_at?: string;
  build_phase?: number;
  build_total_phases?: number;
  build_progress_percent: number;
  claude_code_command?: string;
  github_repo?: string;
  created_at: string;
  updated_at: string;
  ready_to_build_at?: string;
  build_started_at?: string;
  shipped_at?: string;
  archived_at?: string;
  archive_reason?: string;
}

export interface PlanningPhase {
  id: string;
  project_id: string;
  phase_type: PhaseType;
  status: PhaseStatus;
  started_at?: string;
  completed_at?: string;
  incubation_ends_at?: string;
  readiness_check_passed?: boolean;
  readiness_notes?: string;
  created_at: string;
}

export interface PlanningConversation {
  id: string;
  project_id: string;
  phase_id: string;
  title?: string;
  summary?: string;
  started_at: string;
  ended_at?: string;
  message_count: number;
}

export interface PlanningMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlanningResearch {
  id: string;
  project_id: string;
  phase_id?: string;
  conversation_id?: string;
  research_type: ResearchType;
  query: string;
  status: ResearchStatus;
  raw_results?: Record<string, unknown>;
  summary?: string;
  key_findings?: unknown[];
  created_at: string;
  completed_at?: string;
}

export interface PlanningDocument {
  id: string;
  project_id: string;
  doc_type: DocumentType;
  content: string;
  version: number;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanningMemory {
  id: string;
  project_id: string;
  phase_id?: string;
  conversation_id?: string;
  memory_type: MemoryType;
  content: string;
  summary?: string;
  embedding?: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserGoal {
  id: string;
  goal_type: GoalType;
  description: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanningConfig {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

// =============================================================================
// SUMMARY / DASHBOARD TYPES
// =============================================================================

export interface PlanningProjectSummary {
  id: string;
  title: string;
  one_liner?: string;
  status: ProjectStatus;
  current_phase: PhaseType;
  phase_locked_until?: string;
  priority_score?: number;
  phases_completed: number;
  total_phases: number;
  conversation_count: number;
  memory_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlanningDashboardData {
  projects: PlanningProjectSummary[];
  projectsByStatus: Record<ProjectStatus, PlanningProjectSummary[]>;
  goals: UserGoal[];
  stats: {
    totalProjects: number;
    ideasCount: number;
    planningCount: number;
    readyToBuildCount: number;
    buildingCount: number;
    shippedCount: number;
    activeGoalsCount: number;
  };
}

// =============================================================================
// PROJECT DETAIL VIEW TYPES
// =============================================================================

export interface PlanningProjectDetail extends PlanningProject {
  phases: PlanningPhase[];
  recentConversations: PlanningConversation[];
  documents: PlanningDocument[];
  memories: PlanningMemory[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the display color for a project status
 */
export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'idea':
      return 'purple';    // New idea, just captured
    case 'planning':
      return 'amber';     // In planning conversations
    case 'ready_to_build':
      return 'green';     // Ready to build, waiting in queue
    case 'building':
      return 'blue';      // Currently being built
    case 'shipped':
      return 'emerald';   // Complete and launched
    case 'archived':
      return 'gray';      // Archived/rejected
    default:
      return 'gray';
  }
}

/**
 * Get the display label for a project status
 */
export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'idea':
      return 'Idea';
    case 'planning':
      return 'Planning';
    case 'ready_to_build':
      return 'Ready to Build';
    case 'building':
      return 'Building';
    case 'shipped':
      return 'Shipped';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

/**
 * Get the display label for a phase type
 */
export function getPhaseLabel(phase: PhaseType): string {
  switch (phase) {
    case 'capture':
      return 'Capture';
    case 'discover':
      return 'Discover';
    case 'define':
      return 'Define';
    case 'develop':
      return 'Develop';
    case 'validate':
      return 'Validate';
    case 'package':
      return 'Package';
    default:
      return phase;
  }
}

/**
 * Get the display color for a phase status
 */
export function getPhaseStatusColor(status: PhaseStatus): string {
  switch (status) {
    case 'not_started':
      return 'gray';
    case 'in_progress':
      return 'blue';
    case 'incubating':
      return 'amber';    // Waiting for incubation period
    case 'complete':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get the phase icon name (Lucide icon names)
 */
export function getPhaseIcon(phase: PhaseType): string {
  switch (phase) {
    case 'capture':
      return 'lightbulb';     // Initial idea capture
    case 'discover':
      return 'search';        // Research and discovery
    case 'define':
      return 'file-text';     // Problem definition
    case 'develop':
      return 'code';          // Solution development
    case 'validate':
      return 'check-circle';  // Validation checks
    case 'package':
      return 'package';       // GSD packaging
    default:
      return 'circle';
  }
}

/**
 * Get the display label for a memory type
 */
export function getMemoryTypeLabel(type: MemoryType): string {
  switch (type) {
    case 'decision':
      return 'Decision';
    case 'inspiration':
      return 'Inspiration';
    case 'insight':
      return 'Insight';
    case 'pivot':
      return 'Pivot';
    case 'research_finding':
      return 'Research Finding';
    case 'constraint':
      return 'Constraint';
    case 'user_preference':
      return 'User Preference';
    case 'rejection_reason':
      return 'Rejection Reason';
    default:
      return type;
  }
}

/**
 * Get the display label for a goal type
 */
export function getGoalTypeLabel(type: GoalType): string {
  switch (type) {
    case 'revenue':
      return 'Revenue';
    case 'learning':
      return 'Learning';
    case 'strategic':
      return 'Strategic';
    case 'quick_win':
      return 'Quick Win';
    case 'passion':
      return 'Passion Project';
    default:
      return type;
  }
}

/**
 * Check if a project is currently in incubation
 */
export function isIncubating(project: PlanningProject): boolean {
  if (!project.phase_locked_until) return false;
  return new Date(project.phase_locked_until) > new Date();
}

/**
 * Get the remaining incubation time in human-readable format
 */
export function getIncubationTimeRemaining(project: PlanningProject): string | null {
  if (!project.phase_locked_until) return null;

  const now = new Date();
  const lockEnd = new Date(project.phase_locked_until);

  if (lockEnd <= now) return null;

  const diffMs = lockEnd.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d ${diffHours % 24}h`;
  }

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }

  return `${diffMinutes}m`;
}

/**
 * Get approximate incubation time remaining in human-friendly language
 */
export function getApproximateIncubationTime(project: PlanningProject): string | null {
  if (!project.phase_locked_until) return null;
  const lockEnd = new Date(project.phase_locked_until);
  const now = new Date();
  if (lockEnd <= now) return null;

  const hoursLeft = (lockEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft > 36) return 'Available in a few days';
  if (hoursLeft > 20) return 'Available tomorrow morning';
  if (hoursLeft > 12) return 'Available tomorrow';
  if (hoursLeft > 4) return 'Available later today';
  if (hoursLeft > 1) return 'Available in a couple hours';
  return 'Available soon';
}

/**
 * Get the ordered list of phases for progress tracking
 */
export const PHASE_ORDER: PhaseType[] = ['capture', 'discover', 'define', 'develop', 'validate', 'package'];

/**
 * Get the phase index (0-5) for progress calculation
 */
export function getPhaseIndex(phase: PhaseType): number {
  return PHASE_ORDER.indexOf(phase);
}
