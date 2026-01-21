# Phase 8: Chat API - Research

**Researched:** 2026-01-20
**Domain:** Claude API streaming, Next.js SSE, iOS SSE consumption, tool use
**Confidence:** HIGH

## Summary

This phase builds a streaming chat API endpoint that proxies Claude API requests server-side, returning Server-Sent Events (SSE) to the iOS client. The implementation uses the official Anthropic TypeScript SDK (`@anthropic-ai/sdk`) for Claude API integration, with Next.js API routes handling the SSE streaming. The existing X-API-Key authentication pattern from Phase 7 applies unchanged.

The key architectural decision is that Claude API calls happen server-side only - the mobile app sends natural language messages, and the Next.js backend handles Claude communication, tool execution, and streaming the response back. This keeps the Anthropic API key secure and enables server-side tool execution for workflow triggers and data operations.

**Primary recommendation:** Create `/api/mobile/chat` POST endpoint using Next.js Route Handlers with ReadableStream for SSE. Use `@anthropic-ai/sdk` with `client.messages.stream()` for clean event handling. Define tools for workflow triggers, health queries, and data operations. iOS consumes SSE using URLSession bytes streaming with custom event parsing.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.40.0 | Claude API client | Official Anthropic SDK, full TypeScript support, streaming helpers |
| Next.js 16 | 16.1.1 | API routes with streaming | Already in use, native SSE support via ReadableStream |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | Native browser/URLSession APIs sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` | Raw HTTP | SDK provides streaming helpers, type safety - no reason to use raw HTTP |
| ReadableStream SSE | WebSocket | SSE is simpler for one-way streaming, matches Claude API pattern |

**Installation:**
```bash
cd dashboard
npm install @anthropic-ai/sdk
```

**Environment:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/api/mobile/
│   ├── health/route.ts        # Phase 7 (exists)
│   └── chat/route.ts          # Phase 8 - new
├── lib/api/
│   ├── mobile-health.ts       # Phase 7 (exists)
│   └── mobile-chat.ts         # Phase 8 - new (tools, types)
```

### Pattern 1: SSE Route Handler with ReadableStream

**What:** Next.js API route that returns a ReadableStream formatted as SSE events
**When to use:** Streaming responses where server pushes data to client
**Example:**
```typescript
// Source: Next.js docs + Anthropic SDK docs
// dashboard/src/app/api/mobile/chat/route.ts

export const runtime = 'nodejs';  // Required for streaming
export const dynamic = 'force-dynamic';  // Prevent caching

export async function POST(request: NextRequest) {
  // Auth validation (same pattern as health endpoint)
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.MOBILE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, tools } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropic = new Anthropic();
        const messageStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages,
          tools,
        });

        for await (const event of messageStream) {
          // Format as SSE
          const sseEvent = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errorEvent = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
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
```

### Pattern 2: Anthropic SDK Streaming with Event Handlers

**What:** Using the SDK's `.stream()` helper method with typed event handlers
**When to use:** Processing different event types (text, tool_use, message_stop)
**Example:**
```typescript
// Source: https://github.com/anthropics/anthropic-sdk-typescript
const anthropic = new Anthropic();

const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 4096,
  messages: [{ role: 'user', content: userMessage }],
  tools: toolDefinitions,
});

// Process events from raw stream
for await (const event of stream) {
  switch (event.type) {
    case 'content_block_start':
      // New content block starting (text or tool_use)
      break;
    case 'content_block_delta':
      if (event.delta.type === 'text_delta') {
        // Text chunk: event.delta.text
      } else if (event.delta.type === 'input_json_delta') {
        // Tool input being built: event.delta.partial_json
      }
      break;
    case 'content_block_stop':
      // Content block complete
      break;
    case 'message_stop':
      // Message complete
      break;
  }
}

// Or use helper for final message
const finalMessage = await stream.finalMessage();
```

### Pattern 3: Tool Definition with JSON Schema

**What:** Define tools Claude can use with JSON Schema input validation
**When to use:** Any tool that Claude should be able to invoke
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/docs/build-with-claude/tool-use
const tools = [
  {
    name: 'trigger_workflow',
    description: 'Trigger an n8n workflow by ID to perform automated actions',
    input_schema: {
      type: 'object',
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The n8n workflow ID to trigger',
        },
        parameters: {
          type: 'object',
          description: 'Optional parameters to pass to the workflow',
        },
      },
      required: ['workflow_id'],
    },
  },
  {
    name: 'get_health_status',
    description: 'Get current health status for departments or overall system',
    input_schema: {
      type: 'object',
      properties: {
        department: {
          type: 'string',
          enum: ['workflows', 'digital', 'all'],
          description: 'Which department to check health for',
        },
      },
      required: ['department'],
    },
  },
];
```

### Pattern 4: Tool Execution Loop

**What:** Execute tools when Claude requests them, return results, continue conversation
**When to use:** When stop_reason is 'tool_use'
**Example:**
```typescript
// Source: Anthropic tool use docs
async function processToolCalls(
  toolUseBlocks: ToolUseBlock[],
): Promise<ToolResultBlock[]> {
  const results: ToolResultBlock[] = [];

  for (const toolUse of toolUseBlocks) {
    let content: string;

    switch (toolUse.name) {
      case 'trigger_workflow':
        content = await executeWorkflowTrigger(toolUse.input);
        break;
      case 'get_health_status':
        content = await getHealthStatus(toolUse.input);
        break;
      default:
        content = JSON.stringify({ error: 'Unknown tool' });
    }

    results.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content,
    });
  }

  return results;
}

// If Claude wants to use tools, execute and continue
if (response.stop_reason === 'tool_use') {
  const toolResults = await processToolCalls(toolUseBlocks);
  // Continue conversation with tool results
  messages.push({ role: 'assistant', content: response.content });
  messages.push({ role: 'user', content: toolResults });
  // Make another API call
}
```

### Anti-Patterns to Avoid
- **Buffering entire stream before sending:** Next.js can buffer responses. Use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` to prevent.
- **Exposing Claude API key to client:** Always proxy through Next.js, never send ANTHROPIC_API_KEY to mobile.
- **Blocking tool execution:** Execute tools in parallel when possible, don't block stream.
- **Missing SSE format:** Each SSE message must be `data: <json>\n\n` with double newline.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Claude API streaming | Raw HTTP with fetch | `@anthropic-ai/sdk` streaming | SDK handles reconnection, parsing, types |
| Tool input parsing | Manual JSON parsing | SDK's content block helpers | Handles partial JSON, edge cases |
| SSE on iOS | Custom TCP socket | URLSession bytes + manual parsing | URLSession handles connection management |
| Auth middleware | Per-route validation | Extract reusable function | Consistent auth across mobile endpoints |

**Key insight:** The Anthropic SDK handles all the complexity of streaming - partial JSON for tool inputs, event types, error handling. Don't try to implement the streaming protocol directly.

## Common Pitfalls

### Pitfall 1: Next.js Buffering SSE Responses

**What goes wrong:** Client receives entire response at once after stream completes, not incrementally
**Why it happens:** Next.js default runtime and caching behavior buffers responses
**How to avoid:**
```typescript
export const runtime = 'nodejs';        // Not 'edge'
export const dynamic = 'force-dynamic'; // Prevent static optimization
```
**Warning signs:** Response arrives all at once, no streaming visible in network tab

### Pitfall 2: Tool Use Requires Conversation Loop

**What goes wrong:** Claude requests tool use but response ends without executing tool
**Why it happens:** Developer returns response after first Claude call without checking stop_reason
**How to avoid:** Check `stop_reason === 'tool_use'`, execute tools, continue conversation
**Warning signs:** stop_reason is 'tool_use' but no tool execution happens

### Pitfall 3: SSE Format Errors

**What goes wrong:** Client fails to parse SSE events
**Why it happens:** Missing `data:` prefix or double newline separator
**How to avoid:** Always format as `data: ${JSON.stringify(payload)}\n\n`
**Warning signs:** Parse errors on iOS, events not firing

### Pitfall 4: Tool Input JSON Not Complete

**What goes wrong:** Tool input is partial JSON when trying to execute
**Why it happens:** `input_json_delta` events contain partial JSON, must accumulate until content_block_stop
**How to avoid:** Use SDK's stream helpers which accumulate automatically, or wait for content_block_stop before parsing
**Warning signs:** JSON parse errors on tool inputs

### Pitfall 5: Missing Content-Type Header

**What goes wrong:** Browser/iOS doesn't recognize stream as SSE
**Why it happens:** Returning wrong or missing Content-Type header
**How to avoid:** Always set `Content-Type: text/event-stream; charset=utf-8`
**Warning signs:** Client treats response as regular HTTP, not streaming

## iOS SSE Consumption

### Approach: URLSession Bytes Streaming

iOS doesn't have native EventSource like browsers, but URLSession supports streaming bytes that can be parsed as SSE.

**Pattern:**
```swift
// Source: Apple URLSession docs + community patterns
func streamChat(message: String) async throws -> AsyncThrowingStream<ChatEvent, Error> {
    return AsyncThrowingStream { continuation in
        Task {
            var request = URLRequest(url: chatURL)
            request.httpMethod = "POST"
            request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? JSONEncoder().encode(ChatRequest(messages: [message]))

            let (bytes, response) = try await URLSession.shared.bytes(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                throw NetworkError.invalidResponse
            }

            var buffer = ""
            for try await byte in bytes {
                buffer.append(Character(UnicodeScalar(byte)))

                // Check for SSE event boundary (double newline)
                while let eventEnd = buffer.range(of: "\n\n") {
                    let eventData = String(buffer[..<eventEnd.lowerBound])
                    buffer.removeSubrange(..<eventEnd.upperBound)

                    if eventData.hasPrefix("data: ") {
                        let json = String(eventData.dropFirst(6))
                        if json == "[DONE]" {
                            continuation.finish()
                            return
                        }
                        if let event = parseEvent(json) {
                            continuation.yield(event)
                        }
                    }
                }
            }
            continuation.finish()
        }
    }
}
```

### Alternative: Third-Party Library

If manual parsing proves complex, consider [mattt/EventSource](https://github.com/mattt/EventSource) Swift package:

```swift
// AsyncSequence-based API
let eventSource = EventSource(url: url)
for try await event in eventSource.events() {
    print(event.data)
}
```

**Recommendation:** Start with URLSession bytes for minimal dependencies. The Phase 8 API design (simple event format) makes parsing straightforward. Can adopt library if edge cases arise.

## Tool Definitions for Phase 8

Based on requirements (API-06: workflow triggers and data operations), define these initial tools:

### 1. trigger_workflow
```typescript
{
  name: 'trigger_workflow',
  description: 'Trigger an n8n workflow to perform automated actions. Use when user wants to run a specific workflow or automate a task.',
  input_schema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The n8n workflow ID (e.g., "HnZQopXL7xjZnX3O")',
      },
      workflow_name: {
        type: 'string',
        description: 'Human-readable workflow name for confirmation',
      },
      parameters: {
        type: 'object',
        description: 'Optional parameters to pass to the workflow',
        additionalProperties: true,
      },
    },
    required: ['workflow_id', 'workflow_name'],
  },
}
```

### 2. get_health_status
```typescript
{
  name: 'get_health_status',
  description: 'Get current system health status. Use when user asks about system status, health, or if something is working.',
  input_schema: {
    type: 'object',
    properties: {
      department: {
        type: 'string',
        enum: ['workflows', 'digital', 'all'],
        description: 'Which department to check',
      },
      include_alerts: {
        type: 'boolean',
        description: 'Whether to include active alerts',
        default: true,
      },
    },
    required: ['department'],
  },
}
```

### 3. query_workflows
```typescript
{
  name: 'query_workflows',
  description: 'Query information about n8n workflows. Use when user asks about available workflows, workflow status, or recent runs.',
  input_schema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'active', 'failed', 'recent'],
        description: 'Filter workflows by status',
        default: 'all',
      },
      limit: {
        type: 'number',
        description: 'Maximum workflows to return',
        default: 10,
      },
    },
    required: [],
  },
}
```

## SSE Event Format

Simplified event format for iOS consumption:

```typescript
// Text content streaming
{ type: 'text', content: 'Hello' }

// Tool call starting
{ type: 'tool_use_start', id: 'toolu_xxx', name: 'get_health_status' }

// Tool call complete with input
{ type: 'tool_use', id: 'toolu_xxx', name: 'get_health_status', input: { department: 'all' } }

// Tool result
{ type: 'tool_result', id: 'toolu_xxx', content: '{ "score": 92 }' }

// Message complete
{ type: 'done', stop_reason: 'end_turn' }

// Error
{ type: 'error', message: 'Rate limit exceeded' }
```

This is a simplified format that transforms Anthropic's verbose event structure into mobile-friendly events.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket for LLM streaming | SSE | 2023+ | Simpler, HTTP-based, wide support |
| Raw HTTP for Claude API | Official SDK | 2024 | Type safety, streaming helpers |
| Pages API routes | App Router Route Handlers | Next.js 13+ | Better streaming support |
| Polling for chat responses | Native streaming | Always | Real-time UX |

**Deprecated/outdated:**
- Pages API routes (`pages/api/`): App Router route handlers (`app/api/`) preferred for streaming
- Completion API: Messages API is current standard for Claude

## Code Examples

### Complete Chat Route Handler
```typescript
// Source: Anthropic SDK docs + Next.js streaming docs
// dashboard/src/app/api/mobile/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { processChatRequest, formatSSEEvent } from '@/lib/api/mobile-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Validate API key (same pattern as health endpoint)
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

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

          controller.enqueue(encoder.encode(formatSSEEvent({ type: 'done', stop_reason: result.stopReason })));
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(formatSSEEvent({ type: 'error', message: errorMessage })));
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
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Tool Execution Helper
```typescript
// dashboard/src/lib/api/mobile-chat.ts

import Anthropic from '@anthropic-ai/sdk';
import { getMobileHealthData } from './mobile-health';
import { triggerWorkflow, queryWorkflows } from './workflow-triggers';

export const CHAT_TOOLS = [
  // Tool definitions here...
];

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'get_health_status':
      const health = await getMobileHealthData();
      if (input.department === 'all') {
        return JSON.stringify(health);
      }
      const dept = health.departments.find(d => d.id === input.department);
      return JSON.stringify(dept ?? { error: 'Department not found' });

    case 'trigger_workflow':
      return await triggerWorkflow(input.workflow_id as string, input.parameters);

    case 'query_workflows':
      return await queryWorkflows(input.filter as string, input.limit as number);

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

export function formatSSEEvent(event: ChatEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Workflow trigger API details**
   - What we know: n8n has webhook triggers, we have workflow registry
   - What's unclear: Exact webhook endpoint format, authentication for n8n API
   - Recommendation: Define interface now, implement in Phase 8 or defer to Phase 9+

2. **High-risk action confirmation (CHAT-06)**
   - What we know: Requirement says "show confirmation before executing"
   - What's unclear: Whether confirmation happens in chat UI or as separate modal
   - Recommendation: Return `requires_confirmation: true` in tool response, let iOS handle UX

3. **Rate limiting for chat endpoint**
   - What we know: Claude API has rate limits, mobile endpoint should also limit
   - What's unclear: Exact limits appropriate for mobile use
   - Recommendation: Start with 10 req/min per API key, adjust based on usage

## Sources

### Primary (HIGH confidence)
- [Anthropic Streaming Messages](https://platform.claude.com/docs/en/api/messages-streaming) - Official SSE event format, TypeScript examples
- [Anthropic Tool Use](https://platform.claude.com/docs/en/docs/build-with-claude/tool-use) - Tool definition schema, execution pattern
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Installation, streaming helpers

### Secondary (MEDIUM confidence)
- [Upstash SSE Streaming Blog](https://upstash.com/blog/sse-streaming-llm-responses) - Next.js SSE pattern with ReadableStream
- [Medium: Fixing Slow SSE in Next.js](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) - Runtime and dynamic exports
- [mattt/EventSource](https://github.com/mattt/EventSource) - Swift SSE library option

### Tertiary (LOW confidence - needs validation)
- iOS URLSession bytes streaming pattern - Based on Apple docs but needs testing with actual SSE

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK, well-documented
- Architecture: HIGH - Clear patterns from Anthropic docs
- Pitfalls: HIGH - Well-known issues with SSE in Next.js
- iOS consumption: MEDIUM - May need adjustment during implementation

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable APIs)
