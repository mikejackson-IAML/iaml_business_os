// Planning Studio Embeddings Library
// Generates text embeddings via OpenAI text-embedding-3-small

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a single embedding vector from text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single API call.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    throw new Error('Cannot generate embeddings for empty text array');
  }

  const nonEmpty = texts.filter((t) => t.trim());
  if (nonEmpty.length !== texts.length) {
    throw new Error('All texts must be non-empty');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
