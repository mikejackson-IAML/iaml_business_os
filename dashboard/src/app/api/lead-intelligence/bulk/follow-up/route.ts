// Lead Intelligence - Bulk Follow-up Tasks API
// POST /api/lead-intelligence/bulk/follow-up

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';

const VALID_PRIORITIES = ['low', 'medium', 'high'];

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    let body: {
      contactIds?: string[];
      title?: string;
      description?: string;
      due_date?: string;
      priority?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.contactIds) || body.contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required', code: 'VALIDATION_ERROR' },
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

    const rows = body.contactIds.map((contactId) => ({
      contact_id: contactId,
      title: body.title!.trim(),
      description: body.description?.trim() || null,
      due_date: body.due_date,
      priority,
      status: 'pending',
    }));

    const supabase = getServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('follow_up_tasks') as any)
      .insert(rows)
      .select();

    if (error) {
      throw new Error(`Failed to create bulk follow-ups: ${error.message}`);
    }

    return NextResponse.json({ success: true, created: data?.length ?? 0 }, { status: 201 });
  } catch (error) {
    console.error('Bulk follow-up API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
