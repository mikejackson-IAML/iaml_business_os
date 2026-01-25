/**
 * Workflow Templates API - List and Create
 *
 * GET /api/action-center/workflow-templates - List workflow templates
 * POST /api/action-center/workflow-templates - Create workflow template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import {
  createWorkflowTemplateSchema,
  validateWorkflowTemplate,
} from '@/lib/action-center/workflow-template-validation';

const API_KEY = process.env.MOBILE_API_KEY;

/**
 * GET - List workflow templates
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const triggerEvent = searchParams.get('trigger_event');
  const isActive = searchParams.get('is_active');
  const department = searchParams.get('department');

  try {
    const supabase = getServerClient();

    let query = supabase
      .from('workflow_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (triggerEvent) {
      query = query.eq('trigger_event', triggerEvent);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workflow templates:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create workflow template
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate with Zod
    const parseResult = createWorkflowTemplateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Additional validation
    const validation = validateWorkflowTemplate(input);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Template validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('workflow_templates')
      .insert({
        name: input.name,
        description: input.description,
        trigger_event: input.trigger_event,
        trigger_conditions: input.trigger_conditions,
        task_templates: input.task_templates,
        variable_mapping: input.variable_mapping,
        target_date_field: input.target_date_field,
        target_date_offset_days: input.target_date_offset_days,
        department: input.department,
        is_active: input.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow template:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
