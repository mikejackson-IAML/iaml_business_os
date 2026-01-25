/**
 * Event Webhook Endpoint
 *
 * POST /api/action-center/events - Receive events from external systems and route
 *   to matching workflow templates and task rules.
 * GET /api/action-center/events - List registered event types and their handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { eventPayloadSchema } from '@/lib/action-center/workflow-template-validation';
import { evaluateConditions, type Condition } from '@/lib/action-center/template-utils';

// Use same API key auth as other action-center endpoints
const API_KEY = process.env.MOBILE_API_KEY;

/**
 * POST /api/action-center/events
 *
 * Receive events from external systems (n8n, webhooks, etc.) and route them
 * to matching workflow templates and task rules.
 *
 * Request body:
 * - event_type: string (required) - The event type (e.g., 'program_instance.created')
 * - entity_id: string (required) - The entity ID associated with the event
 * - payload: object (required) - Event data for condition evaluation and variable substitution
 * - force: boolean (optional) - Bypass deduplication checks
 * - timestamp: string (optional) - ISO timestamp of the event
 */
export async function POST(request: NextRequest) {
  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const parseResult = eventPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const event = parseResult.data;
    const supabase = getServerClient();

    // Find matching workflow templates
    const { data: templates, error: templatesError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('trigger_event', event.event_type)
      .eq('is_active', true);

    if (templatesError) {
      console.error('Error fetching workflow templates:', templatesError);
      return NextResponse.json(
        { error: 'Database error fetching templates' },
        { status: 500 }
      );
    }

    // Find matching event-triggered task rules
    const { data: rules, error: rulesError } = await supabase
      .from('task_rules')
      .select('*')
      .eq('trigger_event', event.event_type)
      .eq('rule_type', 'event')
      .eq('is_active', true);

    if (rulesError) {
      console.error('Error fetching task rules:', rulesError);
      return NextResponse.json(
        { error: 'Database error fetching rules' },
        { status: 500 }
      );
    }

    const results = {
      event_type: event.event_type,
      entity_id: event.entity_id,
      templates_matched: 0,
      templates_executed: 0,
      rules_matched: 0,
      rules_executed: 0,
      workflows_created: [] as string[],
      tasks_created: [] as string[],
      skipped: [] as { type: string; id: string; reason: string }[],
      errors: [] as { type: string; id: string; error: string }[],
    };

    // Process workflow templates
    for (const template of templates || []) {
      results.templates_matched++;

      // Evaluate conditions
      const conditions = (template.trigger_conditions || []) as Condition[];
      if (!evaluateConditions(conditions, event.payload)) {
        results.skipped.push({
          type: 'workflow_template',
          id: template.id,
          reason: 'condition_not_met',
        });
        continue;
      }

      // Instantiate workflow (implemented in 09-04)
      try {
        const { instantiateWorkflowTemplate } = await import(
          '@/lib/action-center/workflow-template-instantiation'
        );

        const result = await instantiateWorkflowTemplate(
          supabase,
          template,
          event.entity_id,
          event.payload,
          event.force
        );

        if (result.success) {
          results.templates_executed++;
          if (result.workflow_id) {
            results.workflows_created.push(result.workflow_id);
          }
          if (result.task_ids) {
            results.tasks_created.push(...result.task_ids);
          }
        } else {
          results.skipped.push({
            type: 'workflow_template',
            id: template.id,
            reason: result.skipped_reason || 'unknown',
          });
        }
      } catch (error) {
        console.error(`Error instantiating template ${template.id}:`, error);
        results.errors.push({
          type: 'workflow_template',
          id: template.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Process task rules
    for (const rule of rules || []) {
      results.rules_matched++;

      // Evaluate conditions
      const conditions = (rule.trigger_conditions || []) as Condition[];
      if (!evaluateConditions(conditions, event.payload)) {
        results.skipped.push({
          type: 'task_rule',
          id: rule.id,
          reason: 'condition_not_met',
        });
        continue;
      }

      // Execute rule (implemented in 09-05)
      try {
        const { executeTaskRule } = await import(
          '@/lib/action-center/task-rule-execution'
        );

        const result = await executeTaskRule(
          supabase,
          rule,
          event.entity_id,
          event.payload,
          event.force
        );

        if (result.success) {
          results.rules_executed++;
          if (result.task_id) {
            results.tasks_created.push(result.task_id);
          }
        } else {
          results.skipped.push({
            type: 'task_rule',
            id: rule.id,
            reason: result.skipped_reason || 'unknown',
          });
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
        results.errors.push({
          type: 'task_rule',
          id: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Event processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/action-center/events
 *
 * List registered event types and their handlers.
 * Useful for debugging and testing.
 *
 * Query parameters:
 * - event_type: string (optional) - Filter by specific event type
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('event_type');

  const supabase = getServerClient();

  // Get active workflow templates for this event type (or all if not specified)
  let templatesQuery = supabase
    .from('workflow_templates')
    .select('id, name, trigger_event, trigger_conditions, is_active')
    .eq('is_active', true);

  if (eventType) {
    templatesQuery = templatesQuery.eq('trigger_event', eventType);
  }

  const { data: templates, error: templatesError } = await templatesQuery;

  // Get active event-triggered task rules
  let rulesQuery = supabase
    .from('task_rules')
    .select('id, name, trigger_event, trigger_conditions, is_active')
    .eq('rule_type', 'event')
    .eq('is_active', true);

  if (eventType) {
    rulesQuery = rulesQuery.eq('trigger_event', eventType);
  }

  const { data: rules, error: rulesError } = await rulesQuery;

  if (templatesError || rulesError) {
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }

  // Get distinct event types that have handlers
  const eventTypes = new Set([
    ...(templates || []).map(t => t.trigger_event),
    ...(rules || []).map(r => r.trigger_event),
  ]);

  return NextResponse.json({
    registered_event_types: Array.from(eventTypes).sort(),
    workflow_templates: templates || [],
    task_rules: rules || [],
  });
}
