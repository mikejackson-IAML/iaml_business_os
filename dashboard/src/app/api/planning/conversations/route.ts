// Planning Studio Conversations API
// GET: list conversations, POST: create, PATCH: end conversation with summary

import { NextRequest, NextResponse } from 'next/server';
import { getProjectConversations } from '@/lib/api/planning-queries';
import { createConversation, getConversationMessages } from '@/lib/api/planning-chat';
import { extractMemories, generateSummary } from '@/lib/planning/memory-extraction';
import { generateEmbedding } from '@/lib/planning/embeddings';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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

export async function PATCH(request: NextRequest) {
  let body: { conversationId: string; action: string; projectId?: string; projectTitle?: string; phaseType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { conversationId, action, projectId, projectTitle, phaseType } = body;

  if (!conversationId || action !== 'end') {
    return NextResponse.json(
      { error: 'conversationId and action "end" are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch conversation messages and build text
    const messages = await getConversationMessages(conversationId);
    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Generate summary
    const summary = await generateSummary(conversationText);
    const ended_at = new Date().toISOString();

    // Update conversation with summary and ended_at
    const supabase = createServerClient();
    const { error: updateError } = await supabase
      .schema('planning_studio')
      .from('conversations')
      .update({ summary, ended_at })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    // Fire-and-forget memory extraction
    if (projectId && projectTitle && phaseType) {
      const extractionPromise = (async () => {
        try {
          const memories = await extractMemories(conversationText, projectTitle, phaseType);
          if (memories.length > 0) {
            const rows = memories.map((m) => ({
              project_id: projectId,
              conversation_id: conversationId,
              content: m.content,
              memory_type: m.memory_type,
              source_phase: m.source_phase || null,
            }));

            const { data: inserted, error: insertError } = await supabase
              .schema('planning_studio')
              .from('memories')
              .insert(rows)
              .select('id, content');

            if (insertError) {
              console.error('Memory insert error:', insertError);
              return;
            }

            await Promise.allSettled(
              (inserted || []).map(async (row) => {
                const embedding = await generateEmbedding(row.content);
                await supabase
                  .schema('planning_studio')
                  .from('memories')
                  .update({ embedding: JSON.stringify(embedding) })
                  .eq('id', row.id);
              })
            );
          }
        } catch (e) {
          console.error('Memory extraction on conversation end failed:', e);
        }
      })();
      void extractionPromise;
    }

    return NextResponse.json({ summary, ended_at });
  } catch (error) {
    console.error('Error ending conversation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
