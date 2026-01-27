# Phase 4: Conversation Engine - Research

**Researched:** 2026-01-27
**Domain:** Claude API streaming chat with Next.js, Supabase context loading
**Confidence:** HIGH

## Summary

This phase wires the existing disabled conversation shell into a functional AI chat with Claude. The codebase already has a proven streaming SSE pattern in `dashboard/src/app/api/mobile/chat/route.ts` using `@anthropic-ai/sdk ^0.71.2`. The Planning Studio has existing query functions (`getPhaseContext`, `getProjectConversations`), TypeScript types (`PlanningMessage`, `PlanningConversation`), and a conversation shell component ready to be activated.

The approach is straightforward: create a new API route at `/api/planning/chat`, reuse the SSE streaming pattern from mobile chat, build system prompts from the existing templates in `system_prompts.md`, and wire the conversation shell to send/receive messages with Supabase persistence.

**Primary recommendation:** Clone the mobile chat SSE pattern for the planning chat route, but simplify it (no tool use needed in Phase 4). Use the existing `getPhaseContext` RPC for context loading.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.71.2 | Claude API calls + streaming | Already installed in dashboard |
| @supabase/supabase-js | (existing) | Message persistence, context loading | Already used throughout |
| Next.js App Router | (existing) | API route + RSC | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-markdown | (if needed) | Post-stream markdown rendering | After response completes |
| remark-gfm | (if needed) | GFM tables/lists in markdown | Paired with react-markdown |

**No new dependencies required for core functionality.** The Anthropic SDK is already installed. For markdown rendering post-stream, check if react-markdown is already in the project; if not, add it.

**Installation (if react-markdown not present):**
```bash
cd dashboard && npm install react-markdown remark-gfm
```

## Architecture Patterns

### Recommended Structure
```
dashboard/src/
├── app/
│   ├── api/planning/chat/
│   │   └── route.ts              # SSE streaming endpoint
│   └── dashboard/planning/
│       └── [projectId]/
│           └── components/
│               ├── conversation-shell.tsx  # EXISTING — wire up
│               ├── message-list.tsx        # NEW — renders messages
│               ├── message-input.tsx       # NEW — input bar
│               └── chat-provider.tsx       # NEW — state management
├── lib/
│   ├── api/
│   │   ├── planning-queries.ts    # EXISTING — add message queries
│   │   └── planning-chat.ts       # NEW — system prompts, context assembly
│   └── hooks/
│       └── use-planning-chat.ts   # NEW — client-side chat hook
└── dashboard-kit/types/departments/
    └── planning.ts                # EXISTING — types already defined
```

### Pattern 1: SSE Streaming (Clone from Mobile Chat)
**What:** Server creates ReadableStream, encodes SSE events, client reads via EventSource or fetch
**When to use:** All chat responses
**Example (from existing codebase):**
```typescript
// Server: /api/planning/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { conversationId, projectId, phaseType, message } = await request.json();

  // Load context via existing RPC
  const context = await getPhaseContext(projectId, phaseType);

  // Build system prompt from templates
  const systemPrompt = buildSystemPrompt(phaseType, context);

  // Load recent messages for conversation history
  const recentMessages = await getConversationMessages(conversationId);

  const encoder = new TextEncoder();
  const anthropic = new Anthropic();

  const stream = new ReadableStream({
    async start(controller) {
      const messageStream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [...recentMessages, { role: 'user', content: message }],
      });

      let fullResponse = '';
      for await (const event of messageStream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponse += event.delta.text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`));
        }
      }

      // Save messages to DB after stream completes
      await saveMessages(conversationId, message, fullResponse);

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
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

### Pattern 2: Client-Side Chat Hook
**What:** React hook managing messages state, streaming, and API calls
**When to use:** In the conversation shell component
```typescript
// Client: use-planning-chat.ts
function usePlanningChat(projectId: string, phaseType: string) {
  const [messages, setMessages] = useState<PlanningMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function sendMessage(content: string) {
    // Add user message immediately
    // Fetch SSE stream from /api/planning/chat
    // Accumulate streaming content in streamingContent
    // On 'done', move streamingContent to messages array, render as markdown
  }

  return { messages, isStreaming, streamingContent, sendMessage, conversationId };
}
```

### Pattern 3: System Prompt Assembly
**What:** Build system prompt from phase templates + injected context
**When to use:** Every API call
```typescript
// Server: planning-chat.ts
function buildSystemPrompt(
  phaseType: PhaseType,
  context: { conversation_summaries: string[]; document_contents: Array<{type: string; content: string}>; recent_messages: Array<{role: string; content: string}> },
  project: { title: string; one_liner: string }
): string {
  const contextBlock = `## Project Context\n**Project:** ${project.title}\n**One-liner:** ${project.one_liner}\n...`;
  const phasePrompt = PHASE_PROMPTS[phaseType]; // From system_prompts.md
  return `${contextBlock}\n\n${phasePrompt}`;
}
```

### Anti-Patterns to Avoid
- **Rendering markdown during streaming:** User explicitly wants plain text while streaming, markdown after completion. Do NOT use a markdown renderer on the streaming buffer.
- **Loading all messages into system prompt:** Use the `get_phase_context` RPC which returns summaries + last 10 messages, not full history.
- **Creating conversation on page load:** Create conversation record on first message send, not when opening the page.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming | Custom WebSocket | ReadableStream + text/event-stream | Proven pattern already in codebase |
| Context loading | Manual SQL queries | `getPhaseContext` RPC | Already exists, returns summaries + docs + recent messages |
| Message types | New type definitions | Existing `PlanningMessage`, `PlanningConversation` | Already defined in planning.ts |
| Conversation queries | New query functions | Extend `planning-queries.ts` | Follow existing pattern |
| Markdown rendering | Custom parser | react-markdown + remark-gfm | Battle-tested, handles edge cases |

## Common Pitfalls

### Pitfall 1: Forgetting schema-qualified queries
**What goes wrong:** Queries fail silently because `planning_studio` is a separate Postgres schema
**Why it happens:** Default Supabase client targets `public` schema
**How to avoid:** Always use `.schema('planning_studio')` — this is established in the codebase
**Warning signs:** Empty results from queries that should return data

### Pitfall 2: SSE stream not flushing in production
**What goes wrong:** Text appears in large chunks instead of token-by-token
**Why it happens:** Middleware, CDN, or proxy buffering
**How to avoid:** Set `Cache-Control: no-cache, no-transform` and `Connection: keep-alive` headers. Use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'` exports.
**Warning signs:** Works locally but chunky in production

### Pitfall 3: Race condition on conversation creation
**What goes wrong:** Two messages create two conversations for the same session
**Why it happens:** User sends first message, but conversation insert hasn't completed before UI sends second
**How to avoid:** Disable input while first message is processing. Create conversation and first message in a single API call.
**Warning signs:** Duplicate conversations appearing

### Pitfall 4: Context window overflow
**What goes wrong:** System prompt + context + messages exceed model token limit
**Why it happens:** Long documents or many conversation summaries injected
**How to avoid:** Cap document content length, limit summaries to 3-5 most recent, use the RPC's built-in limits (last 10 messages)
**Warning signs:** API errors about token limits

### Pitfall 5: Stale conversation list after new message
**What goes wrong:** Sessions panel doesn't update after sending messages
**Why it happens:** Server component rendered static data, no revalidation
**How to avoid:** Use `router.refresh()` after conversation creation, or lift conversation list into client state
**Warning signs:** "No sessions yet" still showing after first conversation

## Code Examples

### Fetching SSE stream from client
```typescript
// Source: Pattern from existing mobile chat route
async function fetchChatStream(
  projectId: string,
  phaseType: string,
  conversationId: string | null,
  message: string,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
) {
  const response = await fetch('/api/planning/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, phaseType, conversationId, message }),
  });

  if (!response.ok) {
    onError('Failed to send message');
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const event = JSON.parse(line.slice(6));

      if (event.type === 'text') onText(event.content);
      else if (event.type === 'done') onDone();
      else if (event.type === 'error') onError(event.message);
      else if (event.type === 'conversation_id') {
        // Server sends back the conversation ID after creation
      }
    }
  }
}
```

### Saving messages via Supabase (server-side)
```typescript
// Source: Follows existing planning-queries.ts pattern
async function saveMessages(conversationId: string, userContent: string, assistantContent: string) {
  const supabase = createServerClient();

  // Insert both messages
  await supabase.schema('planning_studio').from('messages').insert([
    { conversation_id: conversationId, role: 'user', content: userContent, metadata: {} },
    { conversation_id: conversationId, role: 'assistant', content: assistantContent, metadata: {} },
  ]);

  // Update conversation message count
  await supabase.schema('planning_studio').rpc('increment_message_count', {
    p_conversation_id: conversationId,
    p_increment: 2,
  });
}
```

### Creating conversation on first message
```typescript
async function getOrCreateConversation(
  projectId: string,
  phaseId: string,
  conversationId: string | null
): Promise<string> {
  if (conversationId) return conversationId;

  const supabase = createServerClient();
  const { data } = await supabase
    .schema('planning_studio')
    .from('conversations')
    .insert({
      project_id: projectId,
      phase_id: phaseId,
      title: null, // Auto-title later or leave null
      message_count: 0,
    })
    .select('id')
    .single();

  return data!.id;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vercel AI SDK `useChat` | Direct SDK streaming | N/A | Codebase already uses direct Anthropic SDK, not Vercel AI SDK. Stay consistent. |
| Full conversation in messages array | System prompt context + windowed history | Standard practice | Prevents token overflow |

**Note:** The Vercel AI SDK (`ai` package) provides `useChat` hook that handles streaming automatically. However, the codebase already uses direct `@anthropic-ai/sdk` streaming with manual SSE. Stay consistent with the established pattern rather than introducing a new abstraction.

## Open Questions

1. **Conversation message_count update mechanism**
   - What we know: The `conversations` table has `message_count` column
   - What's unclear: Whether an `increment_message_count` RPC exists or if we need to create it
   - Recommendation: Check if RPC exists; if not, use a simple UPDATE with count subquery

2. **Authentication for planning chat route**
   - What we know: Mobile chat uses API key auth. Planning Studio is a dashboard page (already authenticated via session)
   - What's unclear: Whether the API route should use session auth or a different mechanism
   - Recommendation: Use Next.js session/cookie auth since it's a dashboard feature (check how other dashboard API routes handle auth)

3. **react-markdown availability**
   - What we know: Markdown rendering needed post-stream
   - What's unclear: Whether react-markdown is already installed
   - Recommendation: Check `package.json`; install if not present

## Sources

### Primary (HIGH confidence)
- Existing codebase: `dashboard/src/app/api/mobile/chat/route.ts` — proven SSE streaming pattern
- Existing codebase: `dashboard/src/lib/api/mobile-chat.ts` — full Anthropic SDK streaming with event handling
- Existing codebase: `dashboard/src/lib/api/planning-queries.ts` — `getPhaseContext` RPC already implemented
- Existing codebase: `dashboard/src/dashboard-kit/types/departments/planning.ts` — all types defined
- Existing codebase: `dashboard/src/app/dashboard/planning/[projectId]/components/conversation-shell.tsx` — shell ready to wire
- Reference: `.planning-planning-studio/references/system_prompts.md` — all 6 phase prompts defined

### Secondary (MEDIUM confidence)
- `@anthropic-ai/sdk ^0.71.2` — `messages.stream()` API is stable and well-documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything is already in the codebase
- Architecture: HIGH — direct clone of existing mobile chat pattern
- Pitfalls: HIGH — based on actual codebase patterns and common SSE issues
- System prompts: HIGH — full templates already written in references

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable — no external dependencies changing)
