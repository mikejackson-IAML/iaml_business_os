// Planning Studio Semantic Search API Route
// POST endpoint to search memories by semantic similarity

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/planning/embeddings';

export const runtime = 'nodejs';

interface SearchRequestBody {
  query: string;
  projectId?: string;
  limit?: number;
  threshold?: number;
}

export async function POST(request: NextRequest) {
  let body: SearchRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, projectId, limit, threshold } = body;

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await supabase
      .schema('planning_studio')
      .rpc('search_memories', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold || 0.7,
        match_count: limit || 10,
        filter_project_id: projectId || null,
      });

    if (error) {
      console.error('Search memories RPC error:', error);
      return NextResponse.json({ error: 'Failed to search memories' }, { status: 500 });
    }

    return NextResponse.json({
      results: (data || []).map((row: Record<string, unknown>) => ({
        id: row.id,
        content: row.content,
        memory_type: row.memory_type,
        similarity: row.similarity,
        project_id: row.project_id,
        source_phase: row.source_phase,
        conversation_id: row.conversation_id,
      })),
    });
  } catch (error) {
    console.error('Search API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to search memories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
