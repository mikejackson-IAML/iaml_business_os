# Phase 8: Deep Research Integration - Research

**Researched:** 2026-01-27
**Domain:** Perplexity Sonar API, async research workflow, SSE event integration
**Confidence:** HIGH

## Summary

Phase 8 adds Perplexity-powered research to the Planning Studio conversation flow. The Perplexity API uses an OpenAI-compatible chat completions endpoint (`https://api.perplexity.ai/chat/completions`) with models `sonar` (fast/cheap) and `sonar-pro` (deeper/more accurate). The existing codebase already has a research table, types, a shell ResearchPanel, and an established pattern for marker-based suggestions (doc generation) that maps directly to research suggestions.

The implementation follows the same pattern as Phase 7's document generation: Claude emits a marker in its response, the SSE stream detects it, a suggestion card appears in the UI, user approves/edits, and an async API call handles execution. Research runs are stored in `planning_studio.research` which already exists.

**Primary recommendation:** Use the Perplexity OpenAI-compatible API directly via fetch (no SDK needed), model-select between `sonar` and `sonar-pro` based on query complexity, and follow the exact DocSuggestionCard pattern for ResearchSuggestionCard.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native fetch | N/A | Perplexity API calls | OpenAI-compatible REST API, no SDK needed |
| sonner (already installed) | - | Toast notifications | Already used in dashboard for toasts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None additional | - | - | Perplexity API is simple REST; no new deps required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw fetch | openai SDK | SDK adds dependency for a single endpoint; fetch is simpler |
| Perplexity | Tavily/Serper | Perplexity returns synthesized answers with citations, not raw search results |

**Installation:**
```bash
# No new packages needed. Only env var:
# PERPLEXITY_API_KEY in .env.local
```

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/api/planning/research/
│   └── route.ts                    # POST: trigger research, returns research record
├── lib/planning/
│   └── research-markers.ts         # Detect/strip <!-- RESEARCH: query --> markers
├── app/dashboard/planning/[projectId]/components/
│   ├── research-suggestion-card.tsx # Approval card (like DocSuggestionCard)
│   └── research-panel.tsx          # Already exists - enhance with click-to-view, polling
│   └── research-results-modal.tsx  # Full results viewer
```

### Pattern 1: Marker Detection (matches Phase 7)
**What:** Claude includes `<!-- RESEARCH: query text here -->` in its response. The chat route detects these markers, strips them from stored content, and emits SSE events.
**When to use:** Every research suggestion from Claude.
**Example:**
```typescript
// In lib/planning/research-markers.ts
const RESEARCH_MARKER_REGEX = /<!--\s*RESEARCH:\s*(.+?)\s*-->/g;

export function detectResearchMarkers(content: string): string[] {
  const queries: string[] = [];
  let match;
  while ((match = RESEARCH_MARKER_REGEX.exec(content)) !== null) {
    queries.push(match[1].trim());
  }
  return queries;
}

export function stripResearchMarkers(content: string): string {
  return content.replace(RESEARCH_MARKER_REGEX, '').trim();
}
```

### Pattern 2: Async Research API Route
**What:** POST `/api/planning/research` creates a pending record, fires off Perplexity call, updates record on completion.
**Example:**
```typescript
// In app/api/planning/research/route.ts
export async function POST(request: NextRequest) {
  const { projectId, conversationId, query, phaseId } = await request.json();

  const supabase = createServerClient();

  // 1. Insert pending research record
  const { data: research } = await supabase
    .schema('planning_studio')
    .from('research')
    .insert({
      project_id: projectId,
      conversation_id: conversationId,
      phase_id: phaseId,
      research_type: 'custom',
      query,
      status: 'pending',
    })
    .select()
    .single();

  // 2. Fire-and-forget Perplexity call
  runResearch(research.id, query).catch(console.error);

  // 3. Return immediately with research record
  return NextResponse.json(research);
}

async function runResearch(researchId: string, query: string) {
  const supabase = createServerClient();
  await supabase.schema('planning_studio').from('research')
    .update({ status: 'running' }).eq('id', researchId);

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // or 'sonar' for simple queries
        messages: [
          { role: 'system', content: 'You are a research assistant. Provide thorough, well-cited findings.' },
          { role: 'user', content: query },
        ],
        return_citations: true,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const citations = data.citations || [];

    await supabase.schema('planning_studio').from('research').update({
      status: 'complete',
      raw_results: data,
      summary: content,
      key_findings: { citations, model: data.model },
      completed_at: new Date().toISOString(),
    }).eq('id', researchId);
  } catch (error) {
    await supabase.schema('planning_studio').from('research').update({
      status: 'failed',
      raw_results: { error: String(error) },
    }).eq('id', researchId);
  }
}
```

### Pattern 3: Polling for Completion
**What:** Client polls `/api/planning/research/[id]` or uses a simple interval to check status. When complete, show toast.
**When to use:** After research is triggered, poll every 3-5 seconds until complete/failed.

### Pattern 4: Research Results Injection into Conversation
**What:** When research completes and user sends next message, include research summary in the chat context.
**Example:**
```typescript
// In loadChatContext or buildContextBlock, add:
const pendingResearch = await getCompletedResearchForConversation(conversationId);
if (pendingResearch.length > 0) {
  contextBlock += '\n\n## Recent Research Findings\n';
  for (const r of pendingResearch) {
    contextBlock += `### Query: ${r.query}\n${r.summary}\n\n`;
  }
}
```

### Anti-Patterns to Avoid
- **Streaming Perplexity responses to client:** Research runs async in background; no need to stream Perplexity output. Just store and notify.
- **Blocking the chat on research:** Research is fire-and-forget. User continues chatting while it runs.
- **Custom research type enum in code:** CONTEXT.md says general purpose, no type restrictions. Use 'custom' for all or remove type restriction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Research API calls | Custom HTTP wrapper | Simple fetch to OpenAI-compatible endpoint | It's one endpoint, one call |
| Toast notifications | Custom notification system | sonner (already in project) | Already integrated |
| Polling | WebSocket/SSE for research status | setInterval polling every 3-5s | Research takes 5-30s; polling is simple and sufficient |
| Query editing | Custom input modal | Simple textarea in the suggestion card | Keep it minimal |

## Common Pitfalls

### Pitfall 1: Perplexity API Key Not Server-Side Only
**What goes wrong:** API key exposed to client
**Why it happens:** Calling Perplexity from client-side code
**How to avoid:** All Perplexity calls go through `/api/planning/research` server route only. Key is in `process.env.PERPLEXITY_API_KEY`.

### Pitfall 2: Fire-and-Forget in Serverless
**What goes wrong:** Vercel/Next.js serverless function terminates before Perplexity responds
**Why it happens:** Function returns 200 immediately, background work gets killed
**How to avoid:** Use `waitUntil` from `next/server` if available, OR make the route wait for completion before returning (accepts ~5-30s latency). Alternative: return pending status and have a separate polling endpoint.
**Recommendation:** Have the POST route await the Perplexity call and return the completed result. This is simpler and Perplexity Sonar responds in 2-10 seconds typically. The UI shows a loading state during this time.

### Pitfall 3: Research Type Mismatch
**What goes wrong:** Existing ResearchType enum is restrictive (`icp_deep_dive`, etc.)
**Why it happens:** Types were defined before CONTEXT.md decided on general-purpose research
**How to avoid:** Update the ResearchType to include 'custom' or make it a plain string. The existing schema uses `VARCHAR(50)` so DB is flexible.

### Pitfall 4: Not Updating System Prompt
**What goes wrong:** Claude doesn't know it can suggest research
**How to avoid:** Add research marker instructions to the system prompt, similar to doc generation markers.

## Code Examples

### Perplexity API Call
```typescript
// Source: https://docs.perplexity.ai/
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'sonar-pro',  // or 'sonar' for lightweight
    messages: [
      { role: 'system', content: 'Be precise and cite sources.' },
      { role: 'user', content: 'What are the latest trends in legal education?' },
    ],
    return_citations: true,
    search_recency_filter: 'month', // optional: day, week, month, year
  }),
});

const data = await response.json();
// data.choices[0].message.content - the synthesized answer
// data.citations - array of source URLs
```

### SSE Event for Research Suggestion
```typescript
// In chat/route.ts, after detecting markers:
const researchQueries = detectResearchMarkers(fullContent);
for (const query of researchQueries) {
  controller.enqueue(encoder.encode(formatSSE({
    type: 'research_suggestion',
    query
  })));
}
```

### ResearchSuggestionCard (follows DocSuggestionCard pattern)
```typescript
// Mirrors doc-suggestion-card.tsx exactly
interface ResearchSuggestionCardProps {
  query: string;
  projectId: string;
  conversationId: string;
  onCompleted: (researchId: string) => void;
  onDismiss: () => void;
}
// User can edit query in a textarea before clicking "Research"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `llama-3.1-sonar-*` models | `sonar`, `sonar-pro`, `sonar-reasoning` | Jan 2025 | Use new model names only |
| No citations param | `return_citations: true` | 2025 | Get source URLs in response |

**Model selection guidance:**
- `sonar` ($1/$1 per 1M tokens): Quick factual lookups, simple questions
- `sonar-pro` ($3/$15 per 1M tokens): Deep research, multi-step analysis, better factuality
- Recommendation: Default to `sonar-pro` for planning research (quality matters more than cost here)

## Open Questions

1. **Serverless timeout for fire-and-forget**
   - What we know: Next.js API routes on Vercel have execution limits. Perplexity typically responds in 2-10s.
   - What's unclear: Whether the project deploys to Vercel with strict timeouts or runs on a longer-lived server.
   - Recommendation: Make the route synchronous (await Perplexity response before returning). If too slow, refactor to polling later.

2. **Rate limiting / soft query limit**
   - What we know: CONTEXT.md says "soft limit with warning on queries per project/session"
   - What's unclear: What the actual limit number should be
   - Recommendation: Start with 10 queries per session, 50 per project. Store count in research table, check before allowing new queries.

## Sources

### Primary (HIGH confidence)
- Perplexity API docs: https://docs.perplexity.ai/ - endpoint, models, parameters
- Existing codebase: chat/route.ts, doc-suggestion-card.tsx, research-panel.tsx, conversation-shell.tsx - established patterns

### Secondary (MEDIUM confidence)
- https://www.perplexity.ai/hub/blog/introducing-the-sonar-pro-api - model pricing and capabilities
- https://docs.perplexity.ai/getting-started/models/models/sonar - model details

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Perplexity API is simple REST, no SDK needed
- Architecture: HIGH - Mirrors existing doc generation pattern exactly
- Pitfalls: HIGH - Based on codebase analysis and serverless knowledge

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (Perplexity models stable, codebase patterns established)
