/**
 * Workflow Templates API - Test Endpoint
 *
 * POST /api/action-center/workflow-templates/:id/test - Test template with sample payload
 * GET /api/action-center/workflow-templates/:id/test - Get test instructions and sample payload
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { evaluateConditions } from '@/lib/action-center/template-utils';
import { dryRunWorkflowTemplate } from '@/lib/action-center/workflow-template-instantiation';
import { WorkflowTemplate } from '@/lib/action-center/workflow-template-types';

const API_KEY = process.env.MOBILE_API_KEY;

const testPayloadSchema = z.object({
  payload: z.record(z.unknown()),
  entity_id: z.string().optional().default('test-entity-123'),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST - Test template with sample payload (dry run)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parseResult = testPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { payload } = parseResult.data;

    const supabase = getServerClient();

    const { data: template, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const typedTemplate = template as WorkflowTemplate;

    // Check conditions
    const conditionsPassed = evaluateConditions(
      typedTemplate.trigger_conditions || [],
      payload
    );

    // Dry run
    const dryRunResult = await dryRunWorkflowTemplate(typedTemplate, payload);

    return NextResponse.json({
      success: true,
      template: {
        id: typedTemplate.id,
        name: typedTemplate.name,
        trigger_event: typedTemplate.trigger_event,
        is_active: typedTemplate.is_active,
      },
      conditions: {
        passed: conditionsPassed,
        conditions_count: typedTemplate.trigger_conditions?.length || 0,
      },
      dry_run: dryRunResult,
      note: 'This is a test run. No workflow or tasks were created.',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Show test instructions and sample payload
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const supabase = getServerClient();

  const { data: template, error } = await supabase
    .from('workflow_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const typedTemplate = template as WorkflowTemplate;

  // Generate sample payload
  const samplePayload: Record<string, unknown> = {};

  // Add target date field
  samplePayload[typedTemplate.target_date_field.replace('payload.', '')] =
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

  // Add variables
  if (typedTemplate.variable_mapping) {
    for (const [varName, path] of Object.entries(typedTemplate.variable_mapping)) {
      const fieldName = path.replace('payload.', '');
      if (!samplePayload[fieldName]) {
        samplePayload[fieldName] = `<sample_${varName}>`;
      }
    }
  }

  return NextResponse.json({
    template: {
      id: typedTemplate.id,
      name: typedTemplate.name,
      trigger_event: typedTemplate.trigger_event,
      trigger_conditions: typedTemplate.trigger_conditions,
      target_date_field: typedTemplate.target_date_field,
      variable_mapping: typedTemplate.variable_mapping,
    },
    test_instructions: {
      method: 'POST',
      endpoint: `/api/action-center/workflow-templates/${id}/test`,
      body_schema: {
        payload: 'Record<string, unknown> - Event payload data',
        entity_id: 'string (optional) - Entity ID',
      },
      sample_body: {
        payload: samplePayload,
        entity_id: 'sample-entity-123',
      },
    },
  });
}
