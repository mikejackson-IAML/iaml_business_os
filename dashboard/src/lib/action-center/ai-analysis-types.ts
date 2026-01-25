/**
 * AI Analysis Types
 *
 * TypeScript interfaces for AI task analysis input/output.
 * Used by the AI analysis endpoint to provide weekly planning
 * and productivity insights.
 */

import type { TaskExtended } from '@/lib/api/task-types';

// ==================== Input Types ====================

/**
 * Input data for AI analysis
 */
export interface AIAnalysisInput {
  tasks: TaskExtended[];
  lookbackDays: number;
}

/**
 * Mode for AI analysis - determines prompt focus
 * - planning: Sunday preparation for the week ahead
 * - recap: Friday review of the week's accomplishments
 */
export type AIAnalysisMode = 'planning' | 'recap';

// ==================== Suggestion Types ====================

/**
 * Types of suggestions the AI can make
 */
export type AISuggestionType =
  | 'new_task'           // Create a new task
  | 'priority_change'    // Change priority of existing task
  | 'due_date_change'    // Adjust due date of existing task
  | 'task_breakdown'     // Break a large task into smaller ones
  | 'dependency_add';    // Suggest adding dependencies

/**
 * Priority levels for suggested tasks
 */
export type AISuggestedPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * AI-generated task suggestion
 */
export interface AITaskSuggestion {
  /** Type of suggestion */
  type: AISuggestionType;

  /** Suggested task title (for new_task, task_breakdown) */
  title?: string;

  /** Suggested task description */
  description?: string;

  /** Suggested priority level */
  priority?: AISuggestedPriority;

  /** Suggested due date (ISO string) */
  due_date?: string;

  /** Confidence score (0-100) */
  confidence: number;

  /** Human-readable reasoning (required when confidence < 80) */
  reasoning?: string;

  /** Target task ID (for priority_change, due_date_change, task_breakdown) */
  target_task_id?: string;

  /** Target task title (for context) */
  target_task_title?: string;

  /** For task_breakdown: the subtasks to create */
  subtasks?: Array<{
    title: string;
    description?: string;
    priority?: AISuggestedPriority;
    due_date?: string;
  }>;

  /** For dependency_add: task IDs that should be dependencies */
  suggested_dependencies?: string[];
}

// ==================== Pattern Insight Types ====================

/**
 * Types of patterns the AI can identify
 */
export type AIPatternType =
  | 'recurring_neglect'     // Tasks of a certain type consistently get delayed
  | 'workload_imbalance'    // Uneven distribution of work across days/weeks
  | 'velocity_trend'        // Completion rate increasing or decreasing
  | 'deadline_clustering'   // Too many tasks due around the same time
  | 'priority_drift'        // Tasks staying at wrong priority levels
  | 'completion_streak';    // Positive pattern of consistent completion

/**
 * Severity of identified pattern
 */
export type AIPatternSeverity = 'info' | 'warning' | 'concern';

/**
 * AI-identified pattern insight
 */
export interface AIPatternInsight {
  /** Type of pattern identified */
  type: AIPatternType;

  /** Human-readable description of the pattern */
  description: string;

  /** Severity level of this pattern */
  severity: AIPatternSeverity;

  /** Task IDs or titles affected by this pattern */
  affected_items: string[];

  /** Optional recommendation for addressing the pattern */
  recommendation?: string;
}

// ==================== Analysis Result Types ====================

/**
 * Complete AI analysis result
 */
export interface AIAnalysisResult {
  /** High-level summary of the analysis */
  summary: string;

  /** Suggested actions (capped at max_suggestions) */
  suggestions: AITaskSuggestion[];

  /** Identified patterns in task history */
  patterns: AIPatternInsight[];

  /** Review of the past week's performance (for both modes) */
  last_week_review: string;

  /** For planning mode: focus areas for the week */
  week_focus_areas?: string[];

  /** For recap mode: accomplishments to celebrate */
  accomplishments?: string[];
}

/**
 * API response wrapper for AI analysis
 */
export interface AIAnalysisResponse {
  /** Whether the analysis was successful */
  success: boolean;

  /** Analysis result (when success is true) */
  data?: AIAnalysisResult;

  /** Error message (when success is false) */
  error?: string;

  /** Additional metadata */
  meta?: {
    /** Time taken for analysis in ms */
    duration_ms: number;
    /** Number of tasks analyzed */
    tasks_analyzed: number;
    /** Model used for analysis */
    model: string;
  };
}

// ==================== Request Types ====================

/**
 * Request body for POST /api/action-center/ai-analysis
 */
export interface AIAnalysisRequest {
  /** Analysis mode: planning (Sunday) or recap (Friday) */
  mode: AIAnalysisMode;

  /** Maximum number of suggestions to return (default: 10) */
  max_suggestions?: number;
}
