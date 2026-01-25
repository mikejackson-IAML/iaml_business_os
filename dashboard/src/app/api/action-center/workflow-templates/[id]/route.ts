/**
 * Workflow Templates API - Single Template CRUD
 *
 * GET /api/action-center/workflow-templates/:id - Get single template
 * PATCH /api/action-center/workflow-templates/:id - Update template
 * DELETE /api/action-center/workflow-templates/:id - Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import {
  updateWorkflowTemplateSchema,
  validateTaskDependencies,
  validateVariableUsage,
} from '@/lib/action-center/workflow-template-validation';

const API_KEY = process.env.MOBILE_API_KEY;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Get single workflow template
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

  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update workflow template
 */
export async function PATCH(
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

    const parseResult = updateWorkflowTemplateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // Validate task dependencies if task_templates provided
    if (input.task_templates) {
      const depErrors = validateTaskDependencies(input.task_templates);
      if (depErrors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid task dependencies', details: depErrors },
          { status: 400 }
        );
      }

      // Validate variables if both templates and mapping provided
      if (input.variable_mapping) {
        const varErrors = validateVariableUsage(input.task_templates, input.variable_mapping);
        if (varErrors.length > 0) {
          return NextResponse.json(
            { error: 'Invalid variable usage', details: varErrors },
            { status: 400 }
          );
        }
      }
    }

    const supabase = getServerClient();

    const { data, error } = await supabase
      .from('workflow_templates')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete workflow template
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const authHeader = request.headers.get('x-api-key');
  if (!API_KEY || authHeader !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const supabase = getServerClient();

    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
