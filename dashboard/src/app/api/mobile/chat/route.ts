// Mobile Chat API Route
// Provides authenticated streaming chat endpoint for iOS app
// Uses SSE (Server-Sent Events) for real-time response streaming

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, formatSSEEvent, SYSTEM_PROMPT } from '@/lib/api/mobile-chat';

// Required for streaming - prevents edge runtime which doesn't support ReadableStream well
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequest {
  messages: ChatMessage[];
}

/**
 * POST /api/mobile/chat
 * Streams chat responses via SSE to the iOS app
 *
 * Authentication: Requires X-API-Key header matching MOBILE_API_KEY env var
 *
 * Request body:
 * {
 *   messages: Array<{ role: 'user' | 'assistant', content: string }>
 * }
 *
 * Response: SSE stream with events:
 * - { type: 'text', content: string } - Incremental text chunks
 * - { type: 'done', stop_reason: string } - Stream complete
 * - { type: 'error', message: string } - Error occurred
 */
export async function POST(request: NextRequest) {
  // Validate API key (same pattern as health endpoint)
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate messages array
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages array required' },
      { status: 400 }
    );
  }

  // Validate message structure
  for (const msg of messages) {
    if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create Anthropic client (SDK reads ANTHROPIC_API_KEY from env)
        const anthropic = new Anthropic();

        // Stream Claude response
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        // Process streaming events
        for await (const event of messageStream) {
          switch (event.type) {
            case 'content_block_delta':
              if (event.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(
                  formatSSEEvent({ type: 'text', content: event.delta.text })
                ));
              }
              break;
            case 'message_stop':
              // Message stop is handled after the loop with finalMessage
              break;
          }
        }

        // Get final message to determine stop reason
        const finalMessage = await messageStream.finalMessage();
        controller.enqueue(encoder.encode(
          formatSSEEvent({ type: 'done', stop_reason: finalMessage.stop_reason || 'end_turn' })
        ));

        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Claude API error:', error);

        // Send user-friendly error (don't expose internal details)
        controller.enqueue(encoder.encode(
          formatSSEEvent({ type: 'error', message: 'AI service error. Please try again.' })
        ));
        controller.close();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
