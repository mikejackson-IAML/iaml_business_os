import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { dryRunTaskRule } from '@/lib/action-center/task-rule-execution';
import { TaskRule } from '@/lib/action-center/task-rule-types';
import { evaluateConditions, type Condition } from '@/lib/action-center/template-utils';

const API_KEY = process.env.MOBILE_API_KEY;

const testPayloadSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  entity_id: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = testPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { payload, entity_id } = parseResult.data;

    const supabase = getServerClient();

    // Get the rule
    const { data: rule, error: fetchError } = await supabase
      .from('task_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !rule) {
      return NextResponse.json(
        { error: 'Task rule not found' },
        { status: 404 }
      );
    }

    const typedRule = rule as TaskRule;

    // Check conditions if event rule
    let conditionsResult = { passed: true, details: 'No conditions to check' };
    if (typedRule.rule_type === 'event' && typedRule.trigger_conditions) {
      // Cast trigger_conditions to Condition[] for evaluateConditions
      const conditions = typedRule.trigger_conditions as Condition[];
      const passed = evaluateConditions(conditions, payload);
      conditionsResult = {
        passed,
        details: passed
          ? 'All conditions passed'
          : 'One or more conditions failed',
      };
    }

    // Dry run the rule
    const dryRunResult = dryRunTaskRule(typedRule, {
      ...payload,
      id: entity_id,
      entity_id: entity_id,
    });

    return NextResponse.json({
      success: true,
      rule: {
        id: typedRule.id,
        name: typedRule.name,
        rule_type: typedRule.rule_type,
        is_active: typedRule.is_active,
      },
      conditions: conditionsResult,
      dry_run: dryRunResult,
      note: 'This is a test run. No task was created.',
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
  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const supabase = getServerClient();

  const { data: rule, error } = await supabase
    .from('task_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  const typedRule = rule as TaskRule;

  // Generate sample payload based on rule type and variable mapping
  const samplePayload: Record<string, unknown> = {};
  if (typedRule.variable_mapping) {
    for (const [varName, path] of Object.entries(typedRule.variable_mapping)) {
      // Extract field name from path for sample
      const fieldName = path.split('.').pop() || varName;
      samplePayload[fieldName] = `<sample_${varName}>`;
    }
  }

  return NextResponse.json({
    rule: {
      id: typedRule.id,
      name: typedRule.name,
      rule_type: typedRule.rule_type,
      trigger_event: typedRule.trigger_event,
      trigger_conditions: typedRule.trigger_conditions,
    },
    test_instructions: {
      method: 'POST',
      endpoint: `/api/action-center/task-rules/${id}/test`,
      body_schema: {
        payload: 'Record<string, unknown> - Data for variable substitution',
        entity_id: 'string (optional) - Entity ID for deduplication',
      },
      sample_body: {
        payload: samplePayload,
        entity_id: 'sample-entity-123',
      },
    },
  });
}
