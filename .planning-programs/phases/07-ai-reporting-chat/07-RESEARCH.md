# Phase 7: AI Reporting Chat - Research

**Researched:** 2026-02-02
**Domain:** Natural language interface for program data queries
**Confidence:** HIGH

## Summary

This phase implements a conversational AI interface for querying program data. The research confirms the codebase has established patterns for all required components: SSE streaming chat (Planning Studio), slide-out panels (Sheet component), charting (Tremor), and Supabase data access patterns. The implementation should follow these existing patterns exactly.

The recommended approach is:
1. Create a slide-out chat panel using the existing Sheet component (expanded to 700-800px width)
2. Build an SSE streaming API route following the Planning Studio pattern
3. Use Claude to interpret natural language queries and generate Supabase queries
4. Return structured responses with data that renders as tables (default) or Tremor BarCharts (comparisons)
5. Maintain conversation context in React state (no database persistence)

**Primary recommendation:** Follow the Planning Studio SSE streaming pattern for the chat API, and use structured tool calling with Claude to generate SQL-safe Supabase queries against the existing views (program_dashboard_summary, registration_dashboard_summary).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.71.2 | Claude API for AI chat | Already used in Planning Studio |
| @tremor/react | ^3.18.7 | Bar charts, tables | Already used in web-intel and analytics |
| @radix-ui/react-dialog | ^1.1.15 | Sheet/slide-out panel base | Already used for contact panel |
| react-markdown | ^10.1.0 | Render AI responses | Already used in ask-ai-panel |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.562.0 | Icons (MessageSquare, Send, etc) | UI elements |
| sonner | ^2.0.7 | Toast notifications | Error/success feedback |
| file-saver | ^2.0.5 | CSV export | Table data export |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor BarChart | recharts directly | Tremor is already used and provides consistent styling |
| SSE streaming | Simple POST/response | SSE provides better UX for long responses, already patterned |
| Claude tools | Prompt-only SQL generation | Tools are more reliable, structured output |

**Installation:**
No new dependencies required - all libraries already installed.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/
│   ├── api/
│   │   └── programs/
│   │       └── chat/
│   │           └── route.ts         # SSE streaming chat endpoint
│   └── dashboard/
│       └── programs/
│           └── components/
│               ├── chat-panel/
│               │   ├── chat-panel.tsx       # Main slide-out panel
│               │   ├── chat-input.tsx       # Message input (copy from planning)
│               │   ├── chat-messages.tsx    # Message list with renderers
│               │   ├── result-table.tsx     # Table result renderer
│               │   ├── result-chart.tsx     # Bar chart renderer
│               │   └── example-queries.tsx  # Clickable example queries
│               └── chat-fab.tsx             # Floating action button
├── lib/
│   └── api/
│       └── programs-chat.ts         # Chat helpers, schema context
```

### Pattern 1: SSE Streaming Chat API
**What:** Server-Sent Events for streaming AI responses
**When to use:** Any AI chat interface where responses may be long
**Example:**
```typescript
// Source: dashboard/src/app/api/planning/chat/route.ts
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();

    // Stream Claude response
    const messageStream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemMessage,
      messages: formattedMessages,
    });

    for await (const event of messageStream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`)
        );
      }
    }

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
```

### Pattern 2: Structured Tool Calling for Query Generation
**What:** Use Claude tools to generate structured query parameters
**When to use:** When AI needs to produce structured output (not freeform text)
**Example:**
```typescript
// Define tool for query generation
const tools: Anthropic.Tool[] = [{
  name: 'query_programs',
  description: 'Query program data from the database',
  input_schema: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        enum: ['program_dashboard_summary', 'registration_dashboard_summary']
      },
      filters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          program_name: { type: 'string' },
          year: { type: 'number' },
          status: { type: 'string' }
        }
      },
      aggregation: {
        type: 'object',
        properties: {
          groupBy: { type: 'array', items: { type: 'string' } },
          metrics: { type: 'array', items: { type: 'string', enum: ['count', 'sum_revenue', 'avg_enrolled'] } }
        }
      },
      limit: { type: 'number', default: 100 }
    },
    required: ['table']
  }
}];
```

### Pattern 3: Slide-out Panel with Sheet Component
**What:** Right-side slide-out panel using Radix Dialog
**When to use:** Contextual views that overlay content
**Example:**
```typescript
// Source: dashboard/src/components/ui/sheet.tsx
// Extend the sheet variants for wider panel
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background shadow-lg ...",
  {
    variants: {
      side: {
        right: "inset-y-0 right-0 h-full border-l ... sm:w-[750px]",  // Wider for chat
      },
    },
  }
);
```

### Anti-Patterns to Avoid
- **Direct SQL injection:** Never pass user text directly to SQL - always use tool calling with structured parameters
- **No streaming:** Blocking on full response is poor UX - always stream long AI responses
- **Persisting chat:** Per CONTEXT.md, conversations are ephemeral - don't create database tables for chat history
- **Complex chart types:** Stick to BarChart for v1 - pie/line charts add complexity without value

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming | Custom streaming logic | Copy Planning Studio pattern | Already handles errors, encoding, events |
| Slide-out panel | Custom modal | Sheet component | Animations, accessibility built in |
| Bar charts | SVG/canvas drawing | Tremor BarChart | Responsive, themed, interactive |
| Markdown rendering | Regex parsing | react-markdown | Handles edge cases, XSS safe |
| CSV export | Manual string building | file-saver + manual CSV | file-saver handles browser quirks |

**Key insight:** The codebase already has working patterns for every component of this feature. The risk is in deviating from these patterns, not in following them.

## Common Pitfalls

### Pitfall 1: SQL Injection via AI
**What goes wrong:** Passing AI-generated SQL directly to database
**Why it happens:** Seems efficient to let Claude write SQL
**How to avoid:** Use structured tool calling - Claude returns filter parameters, not SQL strings. Build queries with Supabase client methods.
**Warning signs:** Any string concatenation in query building, raw SQL in prompts

### Pitfall 2: State Persistence Across Navigation
**What goes wrong:** Chat panel loses state when navigating between programs
**Why it happens:** Component unmounts on route change
**How to avoid:** Use React Context at the programs layout level to maintain chat state. Panel can close/reopen while preserving conversation.
**Warning signs:** Testing only on single page, not navigating

### Pitfall 3: Slow First Response
**What goes wrong:** User waits too long before seeing any streaming text
**Why it happens:** Building large context blocks before API call
**How to avoid:** Start streaming immediately, load context in parallel, show thinking indicator
**Warning signs:** More than 1-2 seconds before first character appears

### Pitfall 4: Overwhelming Schema in System Prompt
**What goes wrong:** Claude gets confused with too much schema detail
**Why it happens:** Including every column, relationship, edge case
**How to avoid:** Provide focused schema relevant to queries - main tables, key columns, common relationships. Let Claude ask for more if needed.
**Warning signs:** System prompt over 2000 tokens, hallucinated column names

### Pitfall 5: Chart/Table Format Selection
**What goes wrong:** AI returns wrong format (table when chart better, vice versa)
**Why it happens:** Ambiguous instructions
**How to avoid:** Clear rules in system prompt:
- Comparisons (vs, compare, trend) = BarChart
- Lists (show, list, who) = Table
- Single values (how many, total, average) = Text with number highlight
**Warning signs:** User has to say "show as chart" after query

## Code Examples

Verified patterns from official sources:

### SSE Event Formatting
```typescript
// Source: dashboard/src/app/api/planning/chat/route.ts
function formatSSE(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Usage
controller.enqueue(encoder.encode(formatSSE({ type: 'text', content: text })));
controller.enqueue(encoder.encode(formatSSE({ type: 'data', results: queryResults, format: 'table' })));
controller.enqueue(encoder.encode(formatSSE({ type: 'done' })));
```

### Tremor BarChart for Comparisons
```typescript
// Source: Tremor docs + dashboard patterns
import { BarChart } from '@tremor/react';

interface ComparisonData {
  name: string;
  value: number;
}

<BarChart
  data={[
    { name: 'Austin ERL 2024', value: 45000 },
    { name: 'Austin ERL 2025', value: 52000 },
  ]}
  index="name"
  categories={['value']}
  colors={['blue']}
  valueFormatter={(n) => `$${n.toLocaleString()}`}
  className="h-72"
/>
```

### Table with CSV Export
```typescript
// Source: file-saver usage pattern
import { saveAs } from 'file-saver';

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
}
```

### Chat Input Component (Reusable)
```typescript
// Source: dashboard/src/app/dashboard/planning/[projectId]/components/chat-input.tsx
// Copy directly - handles Enter key, textarea resize, disabled states
```

### Data Schema for AI Context
```typescript
// Minimal schema for system prompt
const SCHEMA_CONTEXT = `
Available tables:
1. program_dashboard_summary - Programs with enrollment and readiness data
   Columns: id, instance_name, program_name, city, state, start_date, end_date,
            current_enrolled, min_capacity, max_capacity, readiness_score, status

2. registration_dashboard_summary - Individual registrations with payment info
   Columns: id, full_name, email, company_name, registration_date, payment_status,
            final_price, program_instance_id, program_name, city

3. companies - Company information
   Columns: id, name, industry, employee_count, total_registrations, total_revenue

Common queries:
- Filter by city: .eq('city', 'Austin')
- Filter by program name containing: .ilike('program_name', '%ERL%')
- Filter by year: .gte('start_date', '2025-01-01').lt('start_date', '2026-01-01')
- Aggregate revenue: sum final_price grouped by company_name
`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple POST/response | SSE streaming | Standard practice | Better UX, shows progress |
| Raw SQL generation | Structured tool calling | Claude 3+ | Safer, more reliable |
| Custom charts | Tremor components | Project standard | Consistent styling |

**Deprecated/outdated:**
- OpenAI SDK: Project uses Anthropic SDK exclusively
- Class components: Use functional components with hooks
- REST polling: Use SSE for real-time updates

## Open Questions

Things that couldn't be fully resolved:

1. **Rate limiting strategy**
   - What we know: API usage tracking exists (logApiUsage)
   - What's unclear: What limits to set for chat queries
   - Recommendation: Start without limits, monitor usage, add if needed

2. **Context-aware suggestions when on program detail page**
   - What we know: CONTEXT.md says "context-aware: knows which program you're viewing"
   - What's unclear: How much context to inject automatically
   - Recommendation: If programId is available, add "Current program: {name}" to system prompt and suggest relevant queries

3. **Error handling for invalid queries**
   - What we know: Need graceful handling
   - What's unclear: Exact error messages and recovery
   - Recommendation: Catch Supabase errors, return friendly message like "I couldn't find data matching that query. Try being more specific about the program or date range."

## Sources

### Primary (HIGH confidence)
- `/dashboard/src/app/api/planning/chat/route.ts` - SSE streaming pattern
- `/dashboard/src/components/ui/sheet.tsx` - Slide-out panel component
- `/dashboard/src/lib/api/programs-queries.ts` - Data access patterns
- `/dashboard/src/app/dashboard/web-intel/components/serp-share-chart.tsx` - Tremor usage
- `/dashboard/package.json` - Installed dependencies

### Secondary (MEDIUM confidence)
- [Tremor BarChart Documentation](https://www.tremor.so/docs/visualizations/bar-chart) - Chart API reference

### Tertiary (LOW confidence)
- None - all patterns verified in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, verified in package.json
- Architecture: HIGH - Follows established patterns from Planning Studio
- Pitfalls: MEDIUM - Based on common patterns, some project-specific

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable libraries, established patterns)
