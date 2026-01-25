/**
 * Workflow Templates API - Toggle Active Status
 *
 * POST /api/action-center/workflow-templates/:id/toggle - Enable/disable template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const API_KEY = process.env.MOBILE_API_KEY;

interface RouteContext {
  params: Promise<{ id: string }>;
}

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
    const supabase = getServerClient();

    // Get current state
    const { data: template, error: fetchError } = await supabase
      .from('workflow_templates')
      .select('id, name, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Toggle
    const newState = !template.is_active;

    const { data: updated, error: updateError } = await supabase
      .from('workflow_templates')
      .update({ is_active: newState, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to toggle template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: updated,
      message: `Template "${updated.name}" is now ${updated.is_active ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error('Toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
