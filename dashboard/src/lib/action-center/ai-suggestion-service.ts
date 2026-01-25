/**
 * AI Suggestion Service
 *
 * Service for managing AI-generated task suggestions.
 * Handles creation of AI-suggested tasks with proper metadata,
 * deduplication, and weekly caps.
 */

import { createTask } from '@/lib/api/task-mutations';
import type { AITaskSuggestion, AISuggestedPriority } from './ai-analysis-types';

// ============================================
// TYPES
// ============================================

/**
 * Result of creating AI suggestions
 */
export interface CreateSuggestionResult {
  /** Number of suggestions successfully created */
  created: number;
  /** Number of suggestions skipped due to duplication */
  skipped: number;
  /** Error messages for failed suggestions */
  errors: string[];
}

// ============================================
// WEEK CALCULATION
// ============================================

/**
 * Get ISO week number for a date
 * Week 1 is the week containing the first Thursday of the year
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ============================================
// HASH FUNCTION
// ============================================

/**
 * Simple hash function for deduplication
 * Creates a short hex hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

// ============================================
// DEDUPE KEY GENERATION
// ============================================

/**
 * Generate a dedupe key for an AI suggestion
 * Format: ai:{suggestion_type}:{year}-W{week}:{hash}
 */
function generateSuggestionDedupeKey(
  suggestion: AITaskSuggestion,
  year: number,
  week: number
): string {
  // Include type and title in hash for uniqueness
  const hashInput = `${suggestion.title || ''}:${suggestion.type}`;
  const hash = simpleHash(hashInput);
  const weekPadded = week.toString().padStart(2, '0');
  return `ai:${suggestion.type}:${year}-W${weekPadded}:${hash}`;
}

// ============================================
// DESCRIPTION BUILDER
// ============================================

/**
 * Build task description from AI suggestion
 * Includes reasoning for low-confidence suggestions
 */
function buildSuggestionDescription(suggestion: AITaskSuggestion): string {
  let desc = suggestion.description || '';

  // Add reasoning for low-confidence suggestions
  if (suggestion.confidence < 80 && suggestion.reasoning) {
    if (desc) {
      desc += '\n\n';
    }
    desc += `**Why AI suggests this:** ${suggestion.reasoning}`;
  }

  return desc;
}

// ============================================
// PRIORITY MAPPING
// ============================================

/**
 * Map AI suggested priority to task priority
 */
function mapPriority(priority?: AISuggestedPriority): 'critical' | 'high' | 'normal' | 'low' {
  return priority || 'normal';
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Create tasks from AI suggestions
 *
 * @param suggestions - Array of AI-generated task suggestions
 * @param maxSuggestions - Maximum number of suggestions to create (default: 10)
 * @returns Result object with counts and errors
 *
 * Features:
 * - Caps at maxSuggestions per call
 * - Uses dedupe_key to prevent duplicates within same week
 * - Sets source='ai' and ai_confidence on created tasks
 * - Includes reasoning in description for low-confidence suggestions
 */
export async function createAISuggestions(
  suggestions: AITaskSuggestion[],
  maxSuggestions: number = 10
): Promise<CreateSuggestionResult> {
  const now = new Date();
  const weekNumber = getISOWeek(now);
  const year = now.getFullYear();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Filter to only new_task and task_breakdown suggestions
  // Other types (priority_change, due_date_change, dependency_add) modify existing tasks
  const creatableSuggestions = suggestions.filter(
    s => s.type === 'new_task' || s.type === 'task_breakdown'
  );

  // Cap at max suggestions
  const toCreate = creatableSuggestions.slice(0, maxSuggestions);

  for (const suggestion of toCreate) {
    // Skip suggestions without a title
    if (!suggestion.title) {
      errors.push(`Suggestion of type ${suggestion.type} missing title, skipped`);
      continue;
    }

    const dedupeKey = generateSuggestionDedupeKey(suggestion, year, weekNumber);

    try {
      await createTask({
        title: suggestion.title,
        description: buildSuggestionDescription(suggestion),
        priority: mapPriority(suggestion.priority),
        due_date: suggestion.due_date || undefined,
        source: 'ai',
        task_type: 'standard',
        dedupe_key: dedupeKey,
        ai_confidence: suggestion.confidence / 100, // Convert 0-100 to 0.00-1.00
        ai_suggested_at: now.toISOString(),
      });
      created++;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'DUPLICATE_DEDUPE_KEY') {
          skipped++;
        } else {
          errors.push(`Failed to create "${suggestion.title}": ${error.message}`);
        }
      } else {
        errors.push(`Failed to create "${suggestion.title}": Unknown error`);
      }
    }

    // Handle task_breakdown subtasks
    if (suggestion.type === 'task_breakdown' && suggestion.subtasks) {
      for (const subtask of suggestion.subtasks) {
        const subtaskDedupeKey = generateSuggestionDedupeKey(
          { ...subtask, type: 'task_breakdown', confidence: suggestion.confidence },
          year,
          weekNumber
        );

        try {
          await createTask({
            title: subtask.title,
            description: subtask.description || '',
            priority: mapPriority(subtask.priority),
            due_date: subtask.due_date || undefined,
            source: 'ai',
            task_type: 'standard',
            dedupe_key: subtaskDedupeKey,
            ai_confidence: suggestion.confidence / 100,
            ai_suggested_at: now.toISOString(),
          });
          created++;
        } catch (error) {
          if (error instanceof Error) {
            if (error.message === 'DUPLICATE_DEDUPE_KEY') {
              skipped++;
            } else {
              errors.push(`Failed to create subtask "${subtask.title}": ${error.message}`);
            }
          }
        }
      }
    }
  }

  return { created, skipped, errors };
}

/**
 * Check how many AI suggestions have been created this week
 * Useful for enforcing weekly caps
 */
export function getCurrentWeekInfo(): { year: number; week: number; dedupePrefix: string } {
  const now = new Date();
  const week = getISOWeek(now);
  const year = now.getFullYear();
  const weekPadded = week.toString().padStart(2, '0');

  return {
    year,
    week,
    dedupePrefix: `ai:%:${year}-W${weekPadded}:%`,
  };
}
