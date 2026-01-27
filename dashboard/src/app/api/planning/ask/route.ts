// Planning Studio Ask AI API Route
// POST endpoint for RAG-based question answering over planning memories

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/planning/embeddings';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const anthropic = new Anthropic();

interface AskRequestBody {
  question: string;
  projectId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface MemoryResult {
  id: string;
  content: string;
  memory_type: string;
  similarity: number;
  project_id: string;
  source_phase: string | null;
  conversation_id: string;
}

export async function POST(request: NextRequest) {
  let body: AskRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { question, projectId, conversationHistory } = body;

  if (!question || !question.trim()) {
    return NextResponse.json({ error: 'question is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // 1. Embed the question
    const queryEmbedding = await generateEmbedding(question);

    // 2. Search memories
    const { data: memories, error: searchError } = await supabase
      .schema('planning_studio')
      .rpc('search_memories', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.7,
        match_count: 10,
        filter_project_id: projectId || null,
      });

    if (searchError) {
      console.error('Memory search error:', searchError);
      return NextResponse.json({ error: 'Failed to search memories' }, { status: 500 });
    }

    const results: MemoryResult[] = memories || [];

    // 3. If no results, return early
    if (results.length === 0) {
      return NextResponse.json({
        answer:
          "I don't have any memories about that yet. Have some conversations first and I'll remember the important parts.",
        sources: [],
      });
    }

    // 4. Build context from memories
    const memoryContext = results
      .map((m) => `- [${m.memory_type}] ${m.content}`)
      .join('\n');

    // 5. Build messages for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Include conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }
      }
    }

    // Add current question with memory context
    messages.push({
      role: 'user',
      content: `Here are relevant memories from planning sessions:\n\n${memoryContext}\n\nQuestion: ${question}`,
    });

    // 6. Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:
        "You are a planning assistant. Answer the user's question based on the memories from their planning sessions. Cite specific memories when relevant. If the memories don't contain enough information, say so honestly. Be conversational and helpful.",
      messages,
    });

    const answer =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      answer,
      sources: results.map((m) => ({
        id: m.id,
        content: m.content,
        memory_type: m.memory_type,
        similarity: m.similarity,
      })),
    });
  } catch (error) {
    console.error('Ask AI error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
