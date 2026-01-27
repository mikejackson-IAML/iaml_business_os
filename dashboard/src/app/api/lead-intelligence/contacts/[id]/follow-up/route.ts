// Lead Intelligence - Create Follow-up Task API
// POST /api/lead-intelligence/contacts/:id/follow-up

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_PRIORITIES = ['low', 'medium', 'high'];

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    let body: { title?: string; description?: string; due_date?: string; priority?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'title is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.due_date || typeof body.due_date !== 'string') {
      return NextResponse.json(
        { error: 'due_date is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const priority = body.priority ?? 'medium';
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('follow_up_tasks') as any)
      .insert({
        contact_id: id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        due_date: body.due_date,
        priority,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create follow-up: ${error.message}`);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Follow-up create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
