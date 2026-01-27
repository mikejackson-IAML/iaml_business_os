# Phase 6: Memory System - Research

**Researched:** 2026-01-27
**Domain:** OpenAI Embeddings, Semantic Search, Memory Extraction via Claude
**Confidence:** HIGH

## Summary

This phase adds memory extraction from planning conversations, embedding generation via OpenAI, semantic search via the existing `search_memories()` RPC, and two Ask AI interfaces (project-scoped sidebar + global Cmd+K). The database schema is fully in place from Phase 1 -- memories table, HNSW index, and search RPC all exist. The chat route (Phase 4) provides the hook point for triggering extraction.

The work is primarily: (1) OpenAI API integration for embeddings, (2) Claude-based memory extraction logic, (3) conversation summary generation, (4) two search UIs with conversational AI answers.

**Primary recommendation:** Use the OpenAI Node SDK directly (no wrapper needed), trigger memory extraction as a background process after conversation stream completes, and build the Ask AI interfaces as separate components that share the same search + synthesis backend.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | ^4.x | Embeddings API client | Official SDK, typed, lightweight |
| `@anthropic-ai/sdk` | ^0.71.2 | Already installed - memory extraction + answer synthesis | Already in use for chat |
| `@supabase/supabase-js` | ^2.90.1 | Already installed - memories CRUD + search RPC | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cmdk` | ^1.x | Cmd+K command palette UI | Global search modal |

**Installation:**
```bash
cd dashboard && npm install openai cmdk
```

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/api/planning/
│   ├── embeddings/route.ts          # POST: generate embeddings for text
│   ├── memories/route.ts            # POST: extract + store memories
│   ├── memories/search/route.ts     # POST: semantic search
│   └── ask/route.ts                 # POST: Ask AI (SSE stream answer from memories)
├── lib/planning/
│   ├── embeddings.ts                # OpenAI embedding client + retry logic
│   ├── memory-extraction.ts         # Claude extraction prompt + parsing
│   └── memory-search.ts             # Search + synthesis logic
└── app/dashboard/planning/
    ├── [projectId]/components/
    │   └── ask-ai-panel.tsx          # Project-scoped Ask AI sidebar
    └── components/
        └── global-search-modal.tsx   # Cmd+K global search
```

### Pattern 1: OpenAI Embedding Generation
**What:** Call text-embedding-3-small to get 1536-dim vectors
**When to use:** Every memory stored, every search query
```typescript
import OpenAI from 'openai';

const openai = new OpenAI(); // uses OPENAI_API_KEY env var

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Batch API supports up to 2048 inputs per call
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map(d => d.embedding);
}
```

### Pattern 2: Memory Extraction via Claude
**What:** Send conversation transcript to Claude with structured extraction prompt
**When to use:** After conversation ends (session change or explicit end)
```typescript
// Extract memories from a conversation transcript
const extractionPrompt = `You are a memory extraction system. Analyze this planning conversation and extract all notable items.

For each memory, output JSON:
{
  "memories": [
    {
      "memory_type": "decision|insight|pivot|constraint|user_preference|rejection_reason|inspiration|research_finding",
      "content": "The full memory content",
      "summary": "One-line summary"
    }
  ],
  "conversation_summary": "2-3 sentence summary of what was discussed and decided"
}

Extract EVERYTHING notable: decisions made, insights discovered, pivots in thinking, user preferences expressed, constraints identified, alternatives rejected and why.`;
```

### Pattern 3: Fire-and-Forget Background Extraction
**What:** Trigger extraction without blocking the user
**When to use:** When user navigates away from conversation or starts new session
```typescript
// In the chat route or via a separate endpoint, after stream completes:
// Don't await - let it run in background
extractAndStoreMemories(conversationId, projectId, phaseId)
  .catch(err => console.error('Memory extraction failed:', err));
```

### Pattern 4: Ask AI with Conversational Synthesis (SSE)
**What:** Search memories, then stream Claude's synthesized answer
**When to use:** Both project-scoped and global Ask AI
```typescript
// 1. Embed the user's question
const queryEmbedding = await generateEmbedding(question);
// 2. Search memories via RPC
const memories = await supabase.schema('planning_studio')
  .rpc('search_memories', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: 10,
    filter_project_id: projectId || null,
    filter_memory_type: null,
  });
// 3. Stream Claude answer with memory context
// Include memories as context, ask Claude to synthesize + cite sources
```

### Pattern 5: Cmd+K with cmdk
**What:** Global keyboard shortcut opens command palette for memory search
```typescript
// Register Cmd+K globally in layout or root component
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(true);
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

### Anti-Patterns to Avoid
- **Blocking on embedding generation:** Never make the user wait for embeddings. Store memory first, embed async.
- **Extracting on every message:** Too expensive. Extract per-conversation or per-session, not per-message.
- **Returning raw memories as search results:** Users want synthesized answers, not a list of memory rows.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command palette UI | Custom modal with keyboard nav | `cmdk` | Keyboard navigation, accessibility, filtering are complex |
| Embedding retry logic | Custom retry loops | Simple exponential backoff helper (3 retries) | OpenAI rate limits are well-understood |
| Vector search | Custom similarity calculation | `search_memories()` RPC (already exists) | pgvector + HNSW already optimized |

## Common Pitfalls

### Pitfall 1: Embedding Format for Supabase RPC
**What goes wrong:** pgvector expects a specific format for vector parameters in RPC calls
**Why it happens:** JavaScript arrays don't automatically serialize correctly for pgvector
**How to avoid:** Pass embedding as `JSON.stringify(embedding)` - Supabase/pgvector accepts JSON array string format for VECTOR type
**Warning signs:** RPC returns error about invalid vector format

### Pitfall 2: Memory Extraction Producing Invalid JSON
**What goes wrong:** Claude sometimes wraps JSON in markdown code blocks or adds commentary
**Why it happens:** LLM output isn't guaranteed to be pure JSON
**How to avoid:** Strip markdown code fences, use try/catch with fallback parsing, or use Claude's tool_use for structured output
**Warning signs:** JSON.parse failures in extraction pipeline

### Pitfall 3: OpenAI API Key Not Available Server-Side
**What goes wrong:** Embeddings fail because OPENAI_API_KEY isn't in env
**Why it happens:** First time using OpenAI in this project
**How to avoid:** Add OPENAI_API_KEY to .env.local and verify in route handler startup
**Warning signs:** 401 errors from OpenAI

### Pitfall 4: Embedding Null Memories in Search
**What goes wrong:** Memories stored without embeddings (failed generation) never appear in search
**Why it happens:** Requirements say store without embedding on failure, retry later
**How to avoid:** Build a simple retry mechanism - periodic check for memories where embedding IS NULL, re-attempt embedding generation
**Warning signs:** Memories exist but search returns nothing

### Pitfall 5: Cmd+K Conflicts
**What goes wrong:** Browser or OS captures Cmd+K before the app
**Why it happens:** Cmd+K is used by browser address bar in some contexts
**How to avoid:** `e.preventDefault()` in the handler, test across browsers
**Warning signs:** Modal doesn't open in certain browsers

## Code Examples

### Supabase RPC Call for Semantic Search
```typescript
const { data: memories, error } = await supabase
  .schema('planning_studio')
  .rpc('search_memories', {
    query_embedding: JSON.stringify(embedding), // JSON string of number[]
    match_count: 10,
    filter_project_id: projectId ?? null,
    filter_memory_type: memoryType ?? null,
  });
```

### Storing a Memory
```typescript
const { data, error } = await supabase
  .schema('planning_studio')
  .from('memories')
  .insert({
    project_id: projectId,
    phase_id: phaseId,
    conversation_id: conversationId,
    memory_type: memory.memory_type,
    content: memory.content,
    summary: memory.summary,
    embedding: JSON.stringify(embedding), // or null if embedding failed
    metadata: { extracted_at: new Date().toISOString() },
  })
  .select()
  .single();
```

### Updating Conversation Summary
```typescript
await supabase
  .schema('planning_studio')
  .from('conversations')
  .update({ summary: conversationSummary })
  .eq('id', conversationId);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| text-embedding-ada-002 | text-embedding-3-small | Jan 2024 | Better quality, same 1536 dims, lower cost |
| Manual RAG pipelines | Same pattern, well-established | Stable | Standard embed-search-synthesize flow |

## Open Questions

1. **Embedding cost at scale**
   - What we know: text-embedding-3-small is ~$0.02/1M tokens, very cheap
   - What's unclear: Volume of memories per conversation (likely 5-20)
   - Recommendation: Not a concern at this scale, no optimization needed

2. **Supabase schema-qualified RPC with vector parameter**
   - What we know: `.schema('planning_studio').rpc('search_memories', {...})` pattern used elsewhere
   - What's unclear: Exact serialization format pgvector expects via Supabase JS client for vector params
   - Recommendation: Test with `JSON.stringify(embedding)` first, fall back to raw array if needed. LOW confidence on exact format.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: existing schema, chat route, planning-chat helpers
- OpenAI documentation: text-embedding-3-small is well-documented, 1536 dimensions, batch support

### Secondary (MEDIUM confidence)
- pgvector + Supabase integration patterns (from training data, widely documented)
- cmdk library for command palette (popular React pattern)

### Tertiary (LOW confidence)
- Exact Supabase JS client serialization for VECTOR type in RPC params (needs testing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenAI SDK + existing Supabase + existing Claude SDK
- Architecture: HIGH - Standard RAG pattern, existing schema supports it fully
- Pitfalls: MEDIUM - Based on common patterns, pgvector serialization needs validation
- Code examples: MEDIUM - Supabase schema-qualified patterns verified from codebase, vector param format needs testing

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable domain, no fast-moving parts)
