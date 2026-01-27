// Planning Studio Conversations API
// GET: list conversations for a project, POST: create new conversation

import { NextRequest, NextResponse } from 'next/server';
import { getProjectConversations } from '@/lib/api/planning-queries';
import { createConversation } from '@/lib/api/planning-chat';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const phaseId = searchParams.get('phaseId') || undefined;

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId query parameter is required' },
      { status: 400 }
    );
  }

  const conversations = await getProjectConversations(projectId, phaseId);
  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  let body: { projectId: string; phaseId: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, phaseId, title } = body;

  if (!projectId || !phaseId) {
    return NextResponse.json(
      { error: 'projectId and phaseId are required' },
      { status: 400 }
    );
  }

  try {
    const conversation = await createConversation(projectId, phaseId, title);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
