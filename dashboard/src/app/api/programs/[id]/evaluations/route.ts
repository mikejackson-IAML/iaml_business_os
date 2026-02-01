import { NextRequest, NextResponse } from 'next/server';
import {
  getEvaluationsForProgram,
  getEvaluationAggregates,
  getEvaluationTemplate,
} from '@/lib/api/programs-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/programs/[id]/evaluations
 * Returns evaluation data for a program:
 * - template: The survey template structure
 * - aggregates: Average scores
 * - responses: Individual evaluation responses
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: programId } = await context.params;

  try {
    // Fetch all evaluation data in parallel
    const [template, aggregates, responses] = await Promise.all([
      getEvaluationTemplate(),
      getEvaluationAggregates(programId),
      getEvaluationsForProgram(programId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        template,
        aggregates,
        responses,
        responseCount: responses.length,
      },
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}
