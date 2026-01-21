// Mobile Workflow Trigger API Route
// Triggers a workflow via its webhook URL

import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById, triggerWorkflow } from '@/lib/api/workflow-triggers';

interface TriggerRequestBody {
  workflow_id: string;
  parameters?: Record<string, unknown>;
}

/**
 * POST /api/mobile/workflows/trigger
 * Triggers a workflow via its webhook URL
 *
 * Authentication: Requires X-API-Key header matching MOBILE_API_KEY env var
 *
 * Request body:
 * {
 *   workflow_id: string,
 *   parameters?: object
 * }
 *
 * Response format:
 * {
 *   success: boolean,
 *   executionId?: string,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    let body: TriggerRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.workflow_id || typeof body.workflow_id !== 'string') {
      return NextResponse.json(
        { error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    // Look up workflow
    const workflow = await getWorkflowById(body.workflow_id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (!workflow.webhook_url) {
      return NextResponse.json(
        { error: 'Workflow cannot be triggered (no webhook URL configured)' },
        { status: 404 }
      );
    }

    // Trigger the workflow
    const result = await triggerWorkflow(
      body.workflow_id,
      workflow.webhook_url,
      body.parameters
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow trigger API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
