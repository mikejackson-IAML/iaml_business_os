/**
 * AI Analysis Utilities
 *
 * Functions for fetching task history, building prompts, calling Claude API,
 * and parsing analysis responses.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getServerClient } from '@/lib/supabase/server';
import type { TaskExtended } from '@/lib/api/task-types';
import type {
  AIAnalysisMode,
  AIAnalysisResult,
  AITaskSuggestion,
  AIPatternInsight,
} from './ai-analysis-types';
import { detectPatterns } from './pattern-detection';

// ==================== Constants ====================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL_ID = 'claude-opus-4-5-20251101';
const MAX_TOKENS = 4096;

// ==================== Data Fetching ====================

/**
 * Fetch task history for analysis
 *
 * @param userId - User ID to fetch tasks for (currently unused, single-user system)
 * @param lookbackDays - Number of days of history to include (default: 90)
 * @returns Array of extended task records
 */
export async function fetchAnalysisData(
  userId: string,
  lookbackDays: number = 90
): Promise<TaskExtended[]> {
  const supabase = getServerClient();

  // Calculate lookback date
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
  const lookbackISO = lookbackDate.toISOString();

  // Fetch tasks from the lookback period
  // Include all statuses to understand completion patterns
  const { data, error } = await supabase
    .from('tasks_extended')
    .select('*')
    .or(`created_at.gte.${lookbackISO},updated_at.gte.${lookbackISO}`)
    .order('created_at', { ascending: false })
    .limit(500); // Cap at 500 to avoid token limits

  if (error) {
    console.error('Error fetching analysis data:', error);
    throw new Error('Failed to fetch task history for analysis');
  }

  return (data || []) as TaskExtended[];
}

// ==================== Prompt Building ====================

/**
 * System prompt establishing the AI's role and tone
 */
const BASE_SYSTEM_PROMPT = `You are an encouraging productivity coach helping a busy CEO manage their tasks and priorities. Your role is to:

1. Analyze task patterns and provide actionable insights
2. Suggest improvements to task organization and prioritization
3. Celebrate wins and progress, no matter how small
4. Gently highlight areas that may need attention
5. Be concise but warm - respect the CEO's time while being supportive

You communicate with:
- An encouraging, positive tone (but not saccharine)
- Specific, actionable suggestions
- Recognition of effort and accomplishments
- Empathy for the challenges of leadership

IMPORTANT: Always respond with valid JSON matching the expected schema. Do not include any text outside the JSON object.`;

/**
 * Build the full system prompt including detected patterns context
 *
 * @param detectedPatterns - Patterns detected from task analysis
 * @returns Full system prompt with pattern context
 */
function buildSystemPrompt(detectedPatterns: AIPatternInsight[]): string {
  if (detectedPatterns.length === 0) {
    return BASE_SYSTEM_PROMPT;
  }

  const patternContext = detectedPatterns
    .map(p => `- ${p.type}: ${p.description}`)
    .join('\n');

  return `${BASE_SYSTEM_PROMPT}

When analyzing tasks, consider these detected patterns from algorithmic analysis:
${patternContext}

Synthesize these patterns with your own observations. You may confirm, expand on, or provide alternative interpretations of these patterns in your response.`;
}

/**
 * Result of building analysis prompts
 */
export interface AnalysisPrompts {
  systemPrompt: string;
  userPrompt: string;
  detectedPatterns: AIPatternInsight[];
}

/**
 * Build the analysis prompts with task data and detected patterns
 *
 * @param tasks - Array of tasks to analyze
 * @param mode - Analysis mode (planning or recap)
 * @param maxSuggestions - Maximum suggestions to return
 * @returns System prompt, user prompt, and detected patterns
 */
export function buildAnalysisPrompt(
  tasks: TaskExtended[],
  mode: AIAnalysisMode,
  maxSuggestions: number = 10
): AnalysisPrompts {
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Detect patterns from task history (runs the 4 pattern algorithms)
  const detectedPatterns = detectPatterns(tasks);

  // Categorize tasks for analysis
  const openTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const dismissedTasks = tasks.filter(t => t.status === 'dismissed');
  const overdueTasks = openTasks.filter(t => t.is_overdue);
  const criticalTasks = openTasks.filter(t => t.priority === 'critical');

  // Calculate completion metrics for last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedLastWeek = completedTasks.filter(
    t => t.completed_at && new Date(t.completed_at) >= oneWeekAgo
  );

  // Build task summary for context
  const taskSummary = {
    total_tasks_analyzed: tasks.length,
    open_count: openTasks.length,
    completed_count: completedTasks.length,
    dismissed_count: dismissedTasks.length,
    overdue_count: overdueTasks.length,
    critical_count: criticalTasks.length,
    completed_last_week: completedLastWeek.length,
  };

  // Format tasks as structured data
  const taskData = {
    open_tasks: openTasks.slice(0, 50).map(formatTaskForAnalysis),
    recently_completed: completedLastWeek.slice(0, 20).map(formatTaskForAnalysis),
    overdue_tasks: overdueTasks.slice(0, 20).map(formatTaskForAnalysis),
    dismissed_with_reasons: dismissedTasks
      .filter(t => t.dismissed_reason)
      .slice(0, 10)
      .map(t => ({
        ...formatTaskForAnalysis(t),
        dismissed_reason: t.dismissed_reason,
      })),
  };

  // Mode-specific instructions
  const modeInstructions = mode === 'planning'
    ? `This is a PLANNING session (${dayOfWeek}). Focus on:
- What should be prioritized this week
- Tasks that may need attention or rescheduling
- Potential blockers to address early
- Setting up the week for success`
    : `This is a RECAP session (${dayOfWeek}). Focus on:
- Celebrating what was accomplished this week
- Identifying patterns in what went well
- Gentle observations about what could improve
- Building momentum for next week`;

  // Build detected patterns section for the prompt
  const detectedPatternsSection = detectedPatterns.length > 0
    ? `

## Detected Patterns (from algorithmic analysis)
The following patterns were detected by our pattern detection algorithms.
Synthesize these with your own observations:
${JSON.stringify(detectedPatterns, null, 2)}
`
    : '';

  const userPrompt = `Analyze the following task data and provide productivity insights.

## Context
${modeInstructions}

Today: ${now.toISOString().split('T')[0]}

## Task Summary
${JSON.stringify(taskSummary, null, 2)}

## Task Data
${JSON.stringify(taskData, null, 2)}
${detectedPatternsSection}
## Required Response Format
Respond with a JSON object matching this exact structure:
{
  "summary": "2-3 sentence high-level summary of the analysis",
  "suggestions": [
    {
      "type": "new_task" | "priority_change" | "due_date_change" | "task_breakdown" | "dependency_add",
      "title": "For new_task: the suggested task title",
      "description": "Brief description or context",
      "priority": "critical" | "high" | "normal" | "low",
      "due_date": "YYYY-MM-DD (optional)",
      "confidence": 0-100,
      "reasoning": "Required if confidence < 80",
      "target_task_id": "For changes to existing tasks",
      "target_task_title": "The title of the task being modified"
    }
  ],
  "patterns": [
    {
      "type": "recurring_neglect" | "workload_imbalance" | "velocity_trend" | "deadline_clustering" | "priority_drift" | "completion_streak",
      "description": "Human-readable description",
      "severity": "info" | "warning" | "concern",
      "affected_items": ["task titles or categories affected"],
      "recommendation": "Optional suggestion for addressing the pattern"
    }
  ],
  "last_week_review": "Brief review of the past week's performance",
  ${mode === 'planning' ? '"week_focus_areas": ["focus area 1", "focus area 2"]' : '"accomplishments": ["accomplishment 1", "accomplishment 2"]'}
}

## Guidelines
- Maximum ${maxSuggestions} suggestions
- Only suggest high-confidence new tasks (>60 confidence)
- Include reasoning when confidence < 80
- Patterns should be based on actual data, not speculation
- You may confirm, expand on, or reframe the detected patterns in your response
- Be encouraging but honest
- Keep summary and review concise (2-3 sentences each)`;

  return {
    systemPrompt: buildSystemPrompt(detectedPatterns),
    userPrompt,
    detectedPatterns,
  };
}

/**
 * Format a task for inclusion in the analysis prompt
 */
function formatTaskForAnalysis(task: TaskExtended): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    due_category: task.due_category,
    is_overdue: task.is_overdue,
    is_blocked: task.is_blocked,
    task_type: task.task_type,
    department: task.department,
    created_at: task.created_at,
    completed_at: task.completed_at,
    workflow_name: task.workflow_name,
  };
}

// ==================== Claude API ====================

/**
 * Call Claude API for analysis
 *
 * @param prompt - The user prompt with task data
 * @param systemPrompt - The system prompt (optional, uses default base prompt)
 * @returns Raw response text from Claude
 */
export async function callClaudeAPI(
  prompt: string,
  systemPrompt: string = BASE_SYSTEM_PROMPT
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });

  try {
    const message = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const textBlock = message.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return textBlock.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Claude API error:', {
        status: error.status,
        message: error.message,
      });

      if (error.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      }

      throw new Error(`Claude API error: ${error.message}`);
    }

    throw error;
  }
}

// ==================== Response Parsing ====================

/**
 * Parse and validate Claude's response
 *
 * @param response - Raw JSON string from Claude
 * @returns Validated AIAnalysisResult
 */
export function parseAnalysisResponse(response: string): AIAnalysisResult {
  // Try to extract JSON from response (Claude sometimes adds explanatory text)
  let jsonStr = response.trim();

  // If response starts with text before JSON, try to find the JSON object
  if (!jsonStr.startsWith('{')) {
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse Claude response as JSON:', response.substring(0, 500));
    throw new Error('Invalid JSON response from AI analysis');
  }

  // Validate structure
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not a valid object');
  }

  const result = parsed as Record<string, unknown>;

  // Validate required fields
  if (typeof result.summary !== 'string') {
    throw new Error('AI response missing required "summary" field');
  }

  if (!Array.isArray(result.suggestions)) {
    throw new Error('AI response missing required "suggestions" array');
  }

  if (!Array.isArray(result.patterns)) {
    throw new Error('AI response missing required "patterns" array');
  }

  if (typeof result.last_week_review !== 'string') {
    throw new Error('AI response missing required "last_week_review" field');
  }

  // Validate and sanitize suggestions
  const suggestions: AITaskSuggestion[] = (result.suggestions as unknown[])
    .filter(isValidSuggestion)
    .map(sanitizeSuggestion);

  // Validate and sanitize patterns
  const patterns: AIPatternInsight[] = (result.patterns as unknown[])
    .filter(isValidPattern)
    .map(sanitizePattern);

  return {
    summary: String(result.summary),
    suggestions,
    patterns,
    last_week_review: String(result.last_week_review),
    week_focus_areas: Array.isArray(result.week_focus_areas)
      ? result.week_focus_areas.map(String)
      : undefined,
    accomplishments: Array.isArray(result.accomplishments)
      ? result.accomplishments.map(String)
      : undefined,
  };
}

/**
 * Type guard for valid suggestion objects
 */
function isValidSuggestion(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return false;
  const suggestion = obj as Record<string, unknown>;

  // Must have type and confidence
  if (!['new_task', 'priority_change', 'due_date_change', 'task_breakdown', 'dependency_add'].includes(String(suggestion.type))) {
    return false;
  }

  if (typeof suggestion.confidence !== 'number' || suggestion.confidence < 0 || suggestion.confidence > 100) {
    return false;
  }

  return true;
}

/**
 * Sanitize and type a suggestion object
 */
function sanitizeSuggestion(obj: Record<string, unknown>): AITaskSuggestion {
  return {
    type: obj.type as AITaskSuggestion['type'],
    title: obj.title ? String(obj.title) : undefined,
    description: obj.description ? String(obj.description) : undefined,
    priority: isValidPriority(obj.priority) ? obj.priority : undefined,
    due_date: obj.due_date ? String(obj.due_date) : undefined,
    confidence: Number(obj.confidence),
    reasoning: obj.reasoning ? String(obj.reasoning) : undefined,
    target_task_id: obj.target_task_id ? String(obj.target_task_id) : undefined,
    target_task_title: obj.target_task_title ? String(obj.target_task_title) : undefined,
  };
}

/**
 * Type guard for valid pattern objects
 */
function isValidPattern(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return false;
  const pattern = obj as Record<string, unknown>;

  if (!['recurring_neglect', 'workload_imbalance', 'velocity_trend', 'deadline_clustering', 'priority_drift', 'completion_streak'].includes(String(pattern.type))) {
    return false;
  }

  if (typeof pattern.description !== 'string') return false;
  if (!['info', 'warning', 'concern'].includes(String(pattern.severity))) return false;
  if (!Array.isArray(pattern.affected_items)) return false;

  return true;
}

/**
 * Sanitize and type a pattern object
 */
function sanitizePattern(obj: Record<string, unknown>): AIPatternInsight {
  return {
    type: obj.type as AIPatternInsight['type'],
    description: String(obj.description),
    severity: obj.severity as AIPatternInsight['severity'],
    affected_items: (obj.affected_items as unknown[]).map(String),
    recommendation: obj.recommendation ? String(obj.recommendation) : undefined,
  };
}

/**
 * Type guard for valid priority values
 */
function isValidPriority(value: unknown): value is AITaskSuggestion['priority'] {
  return ['critical', 'high', 'normal', 'low'].includes(String(value));
}
