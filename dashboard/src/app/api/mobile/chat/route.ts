// Mobile Chat API Route
// Provides authenticated streaming chat endpoint for iOS app
// Uses SSE (Server-Sent Events) for real-time response streaming

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  ChatMessage,
  formatSSEEvent,
  processChatWithTools,
} from '@/lib/api/mobile-chat';

// Required for streaming - prevents edge runtime which doesn't support ReadableStream well
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * - { type: 'tool_use_start', id: string, name: string } - Tool call starting
 * - { type: 'tool_use', id: string, name: string, input: object } - Tool call complete
 * - { type: 'tool_result', id: string, content: string } - Tool execution result
 * - { type: 'done', stop_reason: string } - Stream complete
 * - { type: 'error', message: string } - Error occurred
 */
export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const anthropic = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await processChatWithTools(
          anthropic,
          messages,
          (event) => {
            controller.enqueue(encoder.encode(formatSSEEvent(event)));
          }
        );

        // Send done event
        controller.enqueue(encoder.encode(
          formatSSEEvent({ type: 'done', stop_reason: result.stopReason })
        ));
        controller.close();
      } catch (error) {
        console.error('Chat processing error:', error);
        controller.enqueue(encoder.encode(
          formatSSEEvent({ type: 'error', message: 'AI service error. Please try again.' })
        ));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
