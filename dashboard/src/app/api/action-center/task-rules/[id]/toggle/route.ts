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
    const supabase = getServerClient();

    // Get current state
    const { data: rule, error: fetchError } = await supabase
      .from('task_rules')
      .select('id, name, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !rule) {
      return NextResponse.json(
        { error: 'Task rule not found' },
        { status: 404 }
      );
    }

    // Toggle the state
    const newState = !rule.is_active;

    const { data: updated, error: updateError } = await supabase
      .from('task_rules')
      .update({ is_active: newState, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (updateError) {
      console.error('Error toggling task rule:', updateError);
      return NextResponse.json(
        { error: 'Failed to toggle rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rule: updated,
      message: `Rule "${updated.name}" is now ${updated.is_active ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    console.error('Toggle error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
