// Planning Studio Chat API Route
// Streams Claude responses via SSE for the conversation engine

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getPlanningProject, getPhaseByType } from '@/lib/api/planning-queries';
import {
  saveMessage,
  createConversation,
  getConversationMessages,
  loadChatContext,
} from '@/lib/api/planning-chat';
import { getSystemPrompt, buildContextBlock } from '@/lib/planning/system-prompts';
import { detectCompletionMarker, detectReadinessMarker, stripMarkers } from '@/lib/planning/phase-transitions';
import type { PhaseType } from '@/dashboard-kit/types/departments/planning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatRequestBody {
  projectId: string;
  phaseType: string;
  conversationId?: string;
  message: string;
}

function formatSSE(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const VALID_PHASES: PhaseType[] = ['capture', 'discover', 'define', 'develop', 'validate', 'package'];

export async function POST(request: NextRequest) {
  // Parse request body
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, phaseType, message } = body;
  let { conversationId } = body;

  // Validate required fields
  if (!projectId || !phaseType || !message) {
    return NextResponse.json(
      { error: 'projectId, phaseType, and message are required' },
      { status: 400 }
    );
  }

  if (!VALID_PHASES.includes(phaseType as PhaseType)) {
    return NextResponse.json(
      { error: `Invalid phaseType. Must be one of: ${VALID_PHASES.join(', ')}` },
      { status: 400 }
    );
  }

  // Load project
  const project = await getPlanningProject(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Get phase record
  const phase = await getPhaseByType(projectId, phaseType);
  if (!phase) {
    return NextResponse.json(
      { error: `Phase '${phaseType}' not found for this project` },
      { status: 400 }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const anthropic = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create conversation if needed
        let isNewConversation = false;
        if (!conversationId) {
          const conversation = await createConversation(projectId, phase.id);
          conversationId = conversation.id;
          isNewConversation = true;

          // Send conversation_created event
          controller.enqueue(
            encoder.encode(formatSSE({ type: 'conversation_created', conversationId }))
          );
        }

        // Save user message
        await saveMessage(conversationId, 'user', message);

        // Load context
        const chatContext = await loadChatContext(projectId, phaseType);

        // Build system message
        const contextBlock = buildContextBlock({
          project,
          phaseType,
          conversationSummaries: chatContext.conversationSummaries,
          documents: chatContext.documents,
          recentMessages: chatContext.recentMessages,
        });
        const phasePrompt = getSystemPrompt(phaseType as PhaseType);
        const systemMessage = `${contextBlock}\n\n---\n\n${phasePrompt}`;

        // Fetch existing messages for conversation history
        const existingMessages = await getConversationMessages(conversationId);
        const formattedMessages: Anthropic.MessageParam[] = existingMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        // Stream Claude response
        let fullContent = '';

        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemMessage,
          messages: formattedMessages,
        });

        for await (const event of messageStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullContent += text;
            controller.enqueue(encoder.encode(formatSSE({ type: 'text', content: text })));
          }
        }

        // Detect markers before stripping
        const hasCompletion = detectCompletionMarker(fullContent);
        const readinessResult = detectReadinessMarker(fullContent);

        // Strip markers for storage
        const cleanContent = stripMarkers(fullContent);
        await saveMessage(conversationId, 'assistant', cleanContent);

        // Emit marker events
        if (hasCompletion) {
          controller.enqueue(encoder.encode(formatSSE({ type: 'phase_complete', phaseType })));
        }
        if (readinessResult) {
          controller.enqueue(encoder.encode(formatSSE({ type: 'readiness_result', passed: readinessResult.passed, reason: readinessResult.reason })));
        }

        // Send done event
        controller.enqueue(encoder.encode(formatSSE({ type: 'done' })));
        controller.close();
      } catch (error) {
        console.error('Planning chat error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(formatSSE({ type: 'error', message: errorMessage }))
        );
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
