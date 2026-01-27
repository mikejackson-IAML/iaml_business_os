# Phase 3: AI Search & Intelligence - Research

**Researched:** 2026-01-27
**Domain:** Claude API integration for NL search parsing + contact intelligence summaries
**Confidence:** HIGH

## Summary

This phase adds two AI features: (1) natural language search that parses queries into structured `ContactListParams` filters displayed as removable pills, and (2) AI-generated contact intelligence summaries on the profile Overview tab. The project already has `@anthropic-ai/sdk` v0.71.2 installed and a proven pattern for calling Claude in `src/lib/action-center/ai-analysis.ts` -- this phase follows the same pattern.

The existing `ContactListParams` type already defines all filterable fields (status, state, company_id, title, department, seniority_level, email_status, is_vip, engagement_score range, date range, company_size, program_id). The AI search endpoint simply maps natural language to these existing params. The summary endpoint fetches contact + related data and asks Claude for a narrative summary. Both endpoints are server-side Next.js API routes.

**Primary recommendation:** Follow the existing `ai-analysis.ts` pattern exactly -- same SDK setup, same model, same JSON response parsing. Use Claude Haiku for search parsing (fast, cheap) and Sonnet for summaries (better narrative quality).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.71.2 | Claude API calls | Already installed and used in project |
| next (API routes) | 16.1.1 | Server-side AI endpoints | Already the app framework |
| @supabase/supabase-js | ^2.90.1 | Data fetching for summaries | Already used everywhere |
| framer-motion | ^12.26.1 | Shimmer/loading animations | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast for errors ("Couldn't understand") | Already installed |
| lucide-react | ^0.562.0 | Icons for pills, sparkle for AI | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude Haiku for parsing | Claude Sonnet | Sonnet is overkill for structured extraction; Haiku is faster and cheaper |
| Server-side API route | Edge function | No benefit; standard API route matches project pattern |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/api/lead-intelligence/ai/
│   ├── parse-search/route.ts          # POST - NL query -> ContactListParams
│   └── generate-summary/route.ts      # POST - contactId -> AI summary
├── lib/api/
│   ├── lead-intelligence-ai.ts        # Claude API helpers (system prompts, parsing)
│   └── lead-intelligence-ai-types.ts  # Types for AI search/summary
├── app/dashboard/lead-intelligence/
│   └── components/
│       ├── ai-search-bar.tsx           # Search input with rotating placeholder
│       ├── filter-pills.tsx            # Removable pill display for active filters
│       └── ai-summary-card.tsx         # Intelligence summary on overview tab
```

### Pattern 1: NL Search -> Structured Filters
**What:** POST endpoint receives natural language, returns a `ContactListParams` object via Claude
**When to use:** Every AI search query
**Example:**
```typescript
// System prompt constrains output to match ContactListParams exactly
const SEARCH_SYSTEM_PROMPT = `You parse natural language search queries into structured filters.
Return a JSON object with ONLY these possible keys:
- status: "customer" | "lead" | "prospect" | "inactive" | "do_not_contact"
- state: US state abbreviation
- seniority_level: "c_suite" | "vp" | "director" | "manager" | "senior" | "mid" | "junior" | "entry"
- department: string
- title: string (job title keyword)
- email_status: "valid" | "invalid" | "catch_all" | "unknown"
- is_vip: boolean
- engagement_score_min: number (0-100)
- engagement_score_max: number (0-100)
- company_size: "1-10" | "11-50" | "51-200" | "201-500" | "500+"
- program_id: UUID (only if exact program match)
- search: freetext fallback

If you cannot parse the query into filters, return: { "error": "unparseable", "suggestion": "Try rephrasing..." }
Return ONLY valid JSON.`;

// Use Haiku for speed (sub-1s response)
const message = await anthropic.messages.create({
  model: 'claude-haiku-4-20250414',
  max_tokens: 256,
  system: SEARCH_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: query }],
});
```

### Pattern 2: Contact Intelligence Summary
**What:** Fetch contact data + attendance + activity, send to Claude for narrative summary
**When to use:** First profile view or manual regenerate
**Example:**
```typescript
// Gather all contact context into a single prompt
const contactContext = {
  contact: { name, title, company, state, status, engagement_score, ... },
  attendance: [ { program, date, rating }, ... ],
  activities: [ { type, description, date }, ... ],
  followUps: [ { description, status, due_date }, ... ],
};

const SUMMARY_SYSTEM_PROMPT = `Generate a friendly, conversational intelligence summary for a contact.
Structure your response as JSON:
{
  "headline": "1-2 sentence overview",
  "sections": [
    { "title": "Attendance & Engagement", "content": "..." },
    { "title": "Satisfaction Trends", "content": "..." },
    { "title": "Company Context", "content": "..." },
    { "title": "Suggested Next Steps", "content": "..." }
  ]
}
Tone: Friendly narrative, like briefing a colleague. Not clinical or sales-y.`;
```

### Pattern 3: Summary Caching
**What:** Store generated summaries in a Supabase column/table, check freshness before regenerating
**When to use:** Every profile Overview tab load
**Example:**
```typescript
// Add columns to li_contacts or a new li_contact_summaries table:
// ai_summary: jsonb (the summary object)
// ai_summary_generated_at: timestamptz
// On load: check if summary exists and < 30 days old
// If missing/stale: generate and cache
// Manual refresh: always regenerate regardless of age
```

### Anti-Patterns to Avoid
- **Streaming for search parsing:** Haiku responds in <1s for structured extraction. Streaming adds complexity for no benefit.
- **Client-side Claude calls:** API key must stay server-side. Always use API routes.
- **Overly complex filter mapping:** Don't build a separate "filter language" -- map directly to existing `ContactListParams`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Claude API integration | Custom HTTP client | @anthropic-ai/sdk (already installed) | Handles auth, retries, types |
| JSON response parsing | Custom parser | Existing pattern from ai-analysis.ts (find JSON in response) | Battle-tested in this codebase |
| Loading animations | Custom CSS animations | framer-motion (already installed) + Tailwind animate | Consistent with rest of app |
| Filter state management | Custom state machine | URL search params (existing pattern in contact-filters.tsx) | Already how filters work |

## Common Pitfalls

### Pitfall 1: Claude returning invalid filter values
**What goes wrong:** AI returns values not in the allowed enum (e.g., "Executive" instead of "c_suite")
**Why it happens:** LLM doesn't always respect exact enum constraints
**How to avoid:** Validate every field against allowed values before applying. Strip invalid fields silently.
**Warning signs:** Filters showing "undefined" or empty pills

### Pitfall 2: Slow AI search feeling broken
**What goes wrong:** User types query, waits >3s, thinks it's broken
**Why it happens:** Using a large model for a simple extraction task
**How to avoid:** Use Haiku for search parsing (sub-1s). Show shimmer immediately. Set 5s timeout with fallback to text search.
**Warning signs:** Users abandoning AI search for manual filters

### Pitfall 3: Summary generation blocking profile load
**What goes wrong:** Profile page takes 5+ seconds to load because it waits for AI summary
**Why it happens:** Synchronous summary generation on first view
**How to avoid:** Load profile immediately, generate summary async. Show skeleton/shimmer in the summary area while it loads. Use `useEffect` to trigger generation after mount.
**Warning signs:** Profile page load time regression

### Pitfall 4: Stale cache showing wrong data
**What goes wrong:** Contact data changes but summary still shows old info
**Why it happens:** Summary cached without invalidation
**How to avoid:** Store `generated_at` timestamp, show age prominently. 30-day auto-staleness. Manual regenerate button always available.
**Warning signs:** Users confused by outdated summaries

### Pitfall 5: Program filter requires two-step query
**What goes wrong:** AI returns a program name but filter needs a UUID
**Why it happens:** Prior decision: "two-step-program-filter" -- must fetch program IDs first then use `.in()`
**How to avoid:** When AI returns a program name, do a lookup query to resolve to program_id before applying filter. If no match, drop that filter and note it.
**Warning signs:** Program filter silently returning zero results

## Code Examples

### Existing Claude API Pattern (from ai-analysis.ts)
```typescript
// Source: dashboard/src/lib/action-center/ai-analysis.ts
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101', // Use haiku for search, sonnet for summaries
  max_tokens: MAX_TOKENS,
  system: systemPrompt,
  messages: [{ role: 'user', content: prompt }],
});

const textBlock = message.content.find(block => block.type === 'text');
const responseText = textBlock?.text;
// Parse JSON from response (may have surrounding text)
```

### Existing Filter Params (from contacts-types.ts)
```typescript
// Source: dashboard/src/lib/api/lead-intelligence-contacts-types.ts
interface ContactListParams {
  status?: string;
  state?: string;
  company_id?: string;
  title?: string;
  department?: string;
  seniority_level?: string;
  email_status?: string;
  is_vip?: boolean;
  engagement_score_min?: number;
  engagement_score_max?: number;
  created_after?: string;
  created_before?: string;
  search?: string;
  company_size?: string;
  program_id?: string;
}
```

### Existing Auth Pattern
```typescript
// Source: dashboard/src/app/api/lead-intelligence/contacts/route.ts
// GET routes: no auth needed (dashboard client-side)
// POST routes: validateApiKey from task-auth
import { validateApiKey } from '@/lib/api/task-auth';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OpenAI function calling for structured output | Anthropic SDK with JSON system prompts | Already in codebase | Consistent with existing patterns |
| Full Opus for all tasks | Model selection by task complexity | Current best practice | Haiku for parsing (~0.5s), Sonnet for narratives (~2-3s) |

## Open Questions

1. **Which Haiku model ID to use?**
   - What we know: claude-haiku-4-20250414 exists as of training cutoff
   - What's unclear: Whether a newer Haiku is available
   - Recommendation: Use `claude-haiku-4-20250414` for search parsing. Verify model ID works at implementation time.

2. **Summary storage: column on li_contacts vs separate table?**
   - What we know: Both work. Column is simpler. Separate table allows history.
   - What's unclear: Whether summary history is valuable
   - Recommendation: Add `ai_summary` (jsonb) and `ai_summary_generated_at` (timestamptz) columns to `li_contacts`. Simpler, no joins needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `dashboard/src/lib/action-center/ai-analysis.ts` -- proven Claude API pattern
- Existing codebase: `dashboard/src/lib/api/lead-intelligence-contacts-types.ts` -- ContactListParams definition
- Existing codebase: `dashboard/src/app/dashboard/lead-intelligence/contacts/[id]/tabs/overview-tab.tsx` -- current Overview tab
- Existing codebase: `dashboard/package.json` -- @anthropic-ai/sdk ^0.71.2 already installed

### Secondary (MEDIUM confidence)
- Model selection (Haiku for fast extraction, Sonnet for narrative) -- based on Anthropic model capabilities as of training data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project
- Architecture: HIGH -- follows existing patterns exactly
- Pitfalls: HIGH -- based on direct codebase analysis and common AI integration patterns

**Research date:** 2026-01-27
**Valid until:** 2026-02-27
