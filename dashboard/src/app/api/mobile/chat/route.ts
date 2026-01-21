// Mobile Chat API Route
// Provides authenticated streaming chat endpoint for iOS app
// Uses SSE (Server-Sent Events) for real-time response streaming

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Required for streaming - prevents edge runtime which doesn't support ReadableStream well
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Message type from iOS app
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// SSE event types sent to client
interface TextEvent {
  type: 'text';
  content: string;
}

interface DoneEvent {
  type: 'done';
  stop_reason: string;
}

interface ErrorEvent {
  type: 'error';
  message: string;
}

type SSEEvent = TextEvent | DoneEvent | ErrorEvent;

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
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages array is required and cannot be empty' },
      { status: 400 }
    );
  }

  // Get the last user message for echo (placeholder until Claude integration)
  const lastMessage = body.messages[body.messages.length - 1];
  if (!lastMessage || typeof lastMessage.content !== 'string') {
    return NextResponse.json(
      { error: 'Invalid message format' },
      { status: 400 }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();

  // Helper to format SSE event
  const formatSSE = (event: SSEEvent): string => {
    return `data: ${JSON.stringify(event)}\n\n`;
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Placeholder: Echo the user's message
        // TODO: Replace with actual Claude API call in next plan
        const echoResponse = `Echo: ${lastMessage.content}`;

        // Send text event
        const textEvent: TextEvent = {
          type: 'text',
          content: echoResponse,
        };
        controller.enqueue(encoder.encode(formatSSE(textEvent)));

        // Send done event
        const doneEvent: DoneEvent = {
          type: 'done',
          stop_reason: 'end_turn',
        };
        controller.enqueue(encoder.encode(formatSSE(doneEvent)));

        // Close stream
        controller.close();
      } catch (error) {
        console.error('Chat stream error:', error);

        // Send error event
        const errorEvent: ErrorEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        };
        controller.enqueue(encoder.encode(formatSSE(errorEvent)));
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

// Verify Anthropic SDK imports cleanly (will use in next plan)
// This ensures the SDK is correctly installed and compatible
const _anthropicTypeCheck: typeof Anthropic = Anthropic;
