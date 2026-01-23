import type { DepartmentConfig } from '../dashboard';

// Development Department specific types

export type ProjectStatus = 'idle' | 'executing' | 'needs_input' | 'blocked' | 'complete';
export type PhaseStatus = 'not_started' | 'planning' | 'in_progress' | 'complete' | 'blocked';
export type IdeaStatus = 'captured' | 'planned' | 'rejected' | 'implemented';

export interface PendingDecision {
  id: string;
  type: string;
  question: string;
  options: string[];
  context?: string;
  created_at: string;
}

export interface DevProject {
  id: string;
  project_key: string;
  project_name: string;
  project_path: string;
  description?: string;
  current_milestone: string;
  current_phase: number;
  total_phases: number;
  current_plan?: number;
  total_plans?: number;
  status: ProjectStatus;
  pending_decisions: PendingDecision[];
  last_activity_at?: string;
  last_activity_description?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DevProjectPhase {
  id: string;
  project_id: string;
  phase_number: number;
  phase_name: string;
  description?: string;
  goal?: string;
  status: PhaseStatus;
  completed_at?: string;
  requirements: string[];
  success_criteria: string[];
  plan_count: number;
  plans_complete: number;
  created_at: string;
  updated_at: string;
}

export interface DevProjectIdea {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_milestone?: string;
  priority: number;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

// Summary view types
export interface DevProjectSummary {
  id: string;
  project_key: string;
  project_name: string;
  current_milestone: string;
  current_phase: number;
  total_phases: number;
  status: ProjectStatus;
  last_activity_at?: string;
  last_activity_description?: string;
  pending_decision_count: number;
  completed_phases: number;
  idea_count: number;
}

export interface DevProjectNeedingAttention {
  id: string;
  project_key: string;
  project_name: string;
  current_phase: number;
  total_phases: number;
  status: ProjectStatus;
  pending_decision_count: number;
  last_activity_at?: string;
  priority: string;
  suggested_command?: string;
}

// Dashboard data types
export interface DevelopmentDashboardData {
  projects: DevProjectSummary[];
  projectsNeedingAttention: DevProjectNeedingAttention[];
  phases: Record<string, DevProjectPhase[]>;  // keyed by project_key
  ideas: Record<string, DevProjectIdea[]>;    // keyed by project_key
  stats: {
    totalProjects: number;
    activeProjects: number;
    projectsNeedingInput: number;
    blockedProjects: number;
    totalIdeas: number;
  };
}

// Component props types
export interface ProjectCardProps {
  project: DevProjectSummary;
  onLaunch?: (projectKey: string, command: string) => void;
  onHandleDecisions?: (projectKey: string) => void;
}

export interface RoadmapRowProps {
  project: DevProjectSummary;
  phases: DevProjectPhase[];
  onPhaseClick?: (phase: DevProjectPhase) => void;
}

export interface IdeaFormData {
  project_id: string;
  title: string;
  description?: string;
  target_milestone?: string;
  priority?: number;
}

// Status indicator helper
export function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'idle':
      return 'green';      // Ready to execute
    case 'executing':
      return 'blue';       // In progress
    case 'needs_input':
      return 'yellow';     // Needs attention
    case 'blocked':
      return 'red';        // Blocked
    case 'complete':
      return 'gray';       // Done
    default:
      return 'gray';
  }
}

export function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'executing':
      return 'Executing';
    case 'needs_input':
      return 'Needs Input';
    case 'blocked':
      return 'Blocked';
    case 'complete':
      return 'Complete';
    default:
      return status;
  }
}

export function getPhaseStatusColor(status: PhaseStatus): string {
  switch (status) {
    case 'not_started':
      return 'gray';
    case 'planning':
      return 'yellow';
    case 'in_progress':
      return 'blue';
    case 'complete':
      return 'green';
    case 'blocked':
      return 'red';
    default:
      return 'gray';
  }
}

// Generate launch command for a project
export function getLaunchCommand(project: DevProjectSummary): string | null {
  if (project.status === 'complete') {
    return null;
  }

  const nextPhase = project.status === 'idle'
    ? project.current_phase + 1
    : project.current_phase;

  if (nextPhase > project.total_phases) {
    return null;
  }

  if (project.status === 'needs_input') {
    return `/gsd:discuss-phase ${nextPhase} --project ${project.project_key}`;
  }

  return `/gsd:execute-phase ${nextPhase} --project ${project.project_key}`;
}

// Development department configuration
export const developmentDepartmentConfig: DepartmentConfig = {
  department: 'development',
  title: 'Development',
  summaryPrompt: 'Provide a brief status of all active development projects including: current phase, status, and any blockers or decisions needed.',
  keyMetrics: [
    {
      id: 'active_projects',
      label: 'Active Projects',
      description: 'Projects currently in progress',
      source: 'supabase',
      query: 'dev_projects',
      format: 'number',
      trend: false,
      icon: 'folder-code',
    },
    {
      id: 'needs_input',
      label: 'Needs Input',
      description: 'Projects waiting for decisions',
      source: 'supabase',
      query: 'dev_projects',
      format: 'number',
      trend: false,
      icon: 'message-circle-question',
      warningThreshold: 1,
      criticalThreshold: 3,
    },
    {
      id: 'total_ideas',
      label: 'Ideas Backlog',
      description: 'Captured ideas for future work',
      source: 'supabase',
      query: 'dev_project_ideas',
      format: 'number',
      trend: false,
      icon: 'lightbulb',
    },
  ],
  quickActions: [
    {
      id: 'parallel',
      name: 'Show All Commands',
      command: '/parallel commands',
      description: 'List all ready-to-run commands',
      icon: 'terminal',
    },
    {
      id: 'progress',
      name: 'Check Progress',
      command: '/gsd:progress',
      description: 'View current project status',
      icon: 'bar-chart-3',
    },
  ],
  statusIndicators: {
    healthy: {
      color: 'green',
      conditions: ['no blocked projects', 'no projects needing input > 24h'],
    },
    warning: {
      color: 'yellow',
      conditions: ['projects needing input', 'stale projects'],
    },
    critical: {
      color: 'red',
      conditions: ['blocked projects', 'projects stuck > 48h'],
    },
  },
  commonQuestions: [
    "What's being built?",
    'Which projects need attention?',
    "What's the status of [project]?",
    'What ideas are in the backlog?',
    'What should I work on next?',
  ],
  refreshIntervalSeconds: 30,
};
