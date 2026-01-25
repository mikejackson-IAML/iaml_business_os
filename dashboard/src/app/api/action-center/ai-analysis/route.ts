/**
 * AI Analysis API Endpoint
 *
 * POST /api/action-center/ai-analysis
 *
 * Fetches 90-day task history, calls Claude API for analysis,
 * and returns structured suggestions for weekly planning or recap.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  fetchAnalysisData,
  buildAnalysisPrompt,
  callClaudeAPI,
  parseAnalysisResponse,
} from '@/lib/action-center/ai-analysis';
import { createAISuggestions } from '@/lib/action-center/ai-suggestion-service';
import type { AIAnalysisResponse, SuggestionsCreatedResult } from '@/lib/action-center/ai-analysis-types';

// Use same API key auth as other action-center endpoints
const API_KEY = process.env.MOBILE_API_KEY;

// Default and max suggestions per CONTEXT.md
const DEFAULT_MAX_SUGGESTIONS = 10;
const MAX_SUGGESTIONS_CAP = 20;

// Lookback period for analysis
const LOOKBACK_DAYS = 90;

// Request body schema
const requestSchema = z.object({
  mode: z.enum(['planning', 'recap']),
  max_suggestions: z.number().int().min(1).max(MAX_SUGGESTIONS_CAP).optional(),
  create_suggestions: z.boolean().optional(),
});

/**
 * POST /api/action-center/ai-analysis
 *
 * Request body:
 * - mode: "planning" | "recap" (Sunday vs Friday)
 * - max_suggestions?: number (default: 10, max: 20)
 * - create_suggestions?: boolean (default: false) - If true, creates tasks from suggestions
 *
 * Response:
 * - success: boolean
 * - data?: AIAnalysisResult (when success is true)
 * - error?: string (when success is false)
 * - suggestions_created?: { created, skipped, errors } (when create_suggestions is true)
 * - meta?: { duration_ms, tasks_analyzed, model }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' } as AIAnalysisResponse,
      { status: 401 }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { mode, max_suggestions, create_suggestions } = parseResult.data;
    const maxSuggestions = max_suggestions ?? DEFAULT_MAX_SUGGESTIONS;
    const shouldCreateSuggestions = create_suggestions ?? false;

    // Fetch task history (90 days)
    // Note: userId is placeholder for single-user system
    const tasks = await fetchAnalysisData('placeholder-user', LOOKBACK_DAYS);

    // Handle empty task history
    if (tasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: 'No task history found. Start adding tasks to get personalized insights!',
          suggestions: [],
          patterns: [],
          last_week_review: 'No tasks were tracked in the past week.',
          ...(mode === 'planning'
            ? { week_focus_areas: ['Get started by creating your first task'] }
            : { accomplishments: [] }),
        },
        meta: {
          duration_ms: Date.now() - startTime,
          tasks_analyzed: 0,
          model: 'none',
        },
      } as AIAnalysisResponse);
    }

    // Build prompt with task data
    const prompt = buildAnalysisPrompt(tasks, mode, maxSuggestions);

    // Call Claude API
    const rawResponse = await callClaudeAPI(prompt);

    // Parse and validate response
    const analysisResult = parseAnalysisResponse(rawResponse);

    // Cap suggestions at requested limit
    if (analysisResult.suggestions.length > maxSuggestions) {
      analysisResult.suggestions = analysisResult.suggestions.slice(0, maxSuggestions);
    }

    // Ensure reasoning is present for low-confidence suggestions
    for (const suggestion of analysisResult.suggestions) {
      if (suggestion.confidence < 80 && !suggestion.reasoning) {
        suggestion.reasoning = 'Based on task history patterns.';
      }
    }

    // Optionally create tasks from suggestions
    let suggestionsCreated: SuggestionsCreatedResult | undefined;
    if (shouldCreateSuggestions && analysisResult.suggestions.length > 0) {
      suggestionsCreated = await createAISuggestions(
        analysisResult.suggestions,
        maxSuggestions
      );
    }

    const response: AIAnalysisResponse = {
      success: true,
      data: analysisResult,
      ...(suggestionsCreated && { suggestions_created: suggestionsCreated }),
      meta: {
        duration_ms: Date.now() - startTime,
        tasks_analyzed: tasks.length,
        model: 'claude-opus-4-5-20251101',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI analysis error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Rate limit error
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service rate limit exceeded. Please try again in a few minutes.',
          } as AIAnalysisResponse,
          { status: 429 }
        );
      }

      // API key not configured
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service not configured. Contact administrator.',
          } as AIAnalysisResponse,
          { status: 503 }
        );
      }

      // JSON parsing error
      if (error.message.includes('Invalid JSON')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI response parsing failed. Please try again.',
          } as AIAnalysisResponse,
          { status: 502 }
        );
      }

      // Database error
      if (error.message.includes('Failed to fetch')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database error fetching task history.',
          } as AIAnalysisResponse,
          { status: 500 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during analysis.',
      } as AIAnalysisResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/action-center/ai-analysis
 *
 * Returns API information and health check.
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Anthropic API key is configured
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    endpoint: '/api/action-center/ai-analysis',
    methods: ['GET', 'POST'],
    status: anthropicConfigured ? 'ready' : 'not_configured',
    configuration: {
      model: 'claude-opus-4-5-20251101',
      lookback_days: LOOKBACK_DAYS,
      max_suggestions_cap: MAX_SUGGESTIONS_CAP,
      default_max_suggestions: DEFAULT_MAX_SUGGESTIONS,
    },
    modes: {
      planning: 'Sunday preparation for the week ahead',
      recap: 'Friday review of accomplishments',
    },
  });
}
