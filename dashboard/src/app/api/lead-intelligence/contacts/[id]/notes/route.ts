// Lead Intelligence - Contact Notes API
// GET /api/lead-intelligence/contacts/:id/notes
// POST /api/lead-intelligence/contacts/:id/notes

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactNotes, createContactNote } from '@/lib/api/lead-intelligence-notes-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_NOTE_TYPES = ['general', 'call', 'meeting', 'email', 'system'];

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const data = await getContactNotes(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact notes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    let body: { note_type?: string; content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.note_type || !VALID_NOTE_TYPES.includes(body.note_type)) {
      return NextResponse.json(
        { error: `note_type must be one of: ${VALID_NOTE_TYPES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const note = await createContactNote(id, { note_type: body.note_type, content: body.content.trim() });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Contact note create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
