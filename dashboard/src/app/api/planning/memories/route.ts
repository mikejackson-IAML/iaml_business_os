// Planning Studio Memories API Route
// POST endpoint to store memories with async embedding generation

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/planning/embeddings';
import type { ExtractedMemory } from '@/lib/planning/memory-extraction';

export const runtime = 'nodejs';

interface MemoriesRequestBody {
  projectId: string;
  conversationId: string;
  memories: ExtractedMemory[];
}

export async function POST(request: NextRequest) {
  let body: MemoriesRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, conversationId, memories } = body;

  if (!projectId || !conversationId || !memories || !Array.isArray(memories)) {
    return NextResponse.json(
      { error: 'projectId, conversationId, and memories array are required' },
      { status: 400 }
    );
  }

  if (memories.length === 0) {
    return NextResponse.json({ stored: 0, embedded: 0 });
  }

  const supabase = createServerClient();

  try {
    // Insert all memories
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
      return NextResponse.json({ error: 'Failed to store memories' }, { status: 500 });
    }

    const stored = inserted?.length ?? 0;

    // Fire-and-forget embedding generation
    // Use Promise.allSettled so failures don't block
    const embeddingResults = await Promise.allSettled(
      (inserted || []).map(async (row) => {
        const embedding = await generateEmbedding(row.content);
        const { error: updateError } = await supabase
          .schema('planning_studio')
          .from('memories')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', row.id);

        if (updateError) {
          console.error(`Embedding update failed for memory ${row.id}:`, updateError);
          throw updateError;
        }
      })
    );

    const embedded = embeddingResults.filter((r) => r.status === 'fulfilled').length;

    return NextResponse.json({ stored, embedded });
  } catch (error) {
    console.error('Memories API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process memories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
