// Planning Studio Embeddings API Route
// POST endpoint for generating text embeddings via OpenAI

import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateEmbeddings } from '@/lib/planning/embeddings';

export const runtime = 'nodejs';

interface EmbeddingRequestBody {
  text?: string;
  texts?: string[];
}

export async function POST(request: NextRequest) {
  let body: EmbeddingRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, texts } = body;

  if (!text && !texts) {
    return NextResponse.json(
      { error: 'Either "text" (string) or "texts" (string[]) is required' },
      { status: 400 }
    );
  }

  try {
    if (texts && Array.isArray(texts)) {
      const embeddings = await generateEmbeddings(texts);
      return NextResponse.json({ embeddings });
    }

    if (text) {
      const embedding = await generateEmbedding(text);
      return NextResponse.json({ embedding });
    }

    return NextResponse.json(
      { error: 'Invalid input format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Embedding generation error:', error);
    const message = error instanceof Error ? error.message : 'Embedding generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
