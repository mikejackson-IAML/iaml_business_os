// Planning Studio Messages API
// GET: fetch all messages for a conversation

import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/api/planning-queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId is required' },
      { status: 400 }
    );
  }

  const messages = await getConversationMessages(conversationId);
  return NextResponse.json(messages);
}
