# Phase 5: Content Generation & Drafts - Research

**Researched:** 2026-02-15
**Domain:** n8n workflow (WF4 Content Generation Pipeline) + Next.js dashboard (Drafts tab)
**Confidence:** HIGH

## Summary

Phase 5 builds two interconnected deliverables: (1) an n8n workflow (WF4) that takes approved topics from Phase 4 and generates LinkedIn post drafts via Claude Sonnet, and (2) a dashboard Drafts tab that enables reviewing, comparing hooks, editing, regenerating, and approving drafts.

The n8n workflow follows the established pattern from WF3 (Topic Scoring Engine): HTTP Request nodes for Supabase REST API, Claude API calls via HTTP Request with `anthropic-api` credential, Code nodes for data transformation, and canary error handling. The key difference is the trigger mechanism -- WF4 uses a webhook trigger (fired by the dashboard when a topic is approved) rather than a schedule trigger.

The dashboard work extends the existing `linkedin-content.tsx` component, adds new API routes for draft mutations (approve, reject, select hook, edit, trigger regeneration), and needs a schema migration to add fields not yet present (`pillar` is in the database but missing from TypeScript types; hook variations need a storage model decision).

**Primary recommendation:** Store drafts as one row per topic in the `posts` table with 3 hook variations stored in a new JSONB column (`hook_variations`), plus separate `full_text` versions per hook. Use the n8n webhook node (POST) for the trigger, with the dashboard firing an asynchronous request and polling for completion via `workflow_runs` table status.

## Standard Stack

The stack is fully locked by prior phases. No new libraries needed.

### Core (Already in Use)
| Library/Tool | Version | Purpose | Already Established |
|---------|---------|---------|---------------------|
| n8n (self-hosted) | Latest | Workflow orchestration for WF4 | Yes - WF1, WF2, WF3 built |
| Supabase REST API | v1 | Database reads/writes from n8n | Yes - `Dy6aCSbL5Tup4TnE` credential |
| Claude API (Sonnet) | `claude-sonnet-4-20250514` | Content generation | Yes - WF1, WF3 use same model |
| Next.js 16 | 16.1.1 | Dashboard framework | Yes - dashboard already running |
| React 19 | 19.2.3 | UI components | Yes |
| Radix UI Tabs | 1.1.13 | Tab switching (Drafts tab) | Yes - already used in linkedin-content.tsx |
| Lucide React | 0.562.0 | Icons | Yes |
| Sonner | 2.0.7 | Toast notifications | Yes - used in planning, programs |
| Tailwind CSS | 3.4.19 | Styling | Yes |

### Supporting (Available, May Use)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop | Calendar slot rearranging (if implementing drag) |
| framer-motion | 12.26.1 | Animations | Tab transitions, card animations |
| @radix-ui/react-dialog | 1.1.15 | Modal dialogs | Regeneration instruction input, edit modal |
| @radix-ui/react-select | 2.2.6 | Dropdown select | Hook variation selector |
| @radix-ui/react-tooltip | 1.2.8 | Tooltips | Score explanations, metadata hints |

### No New Dependencies Needed
All required UI primitives (tabs, dialogs, select, tooltip) are already installed. No new npm packages are required for Phase 5.

## Architecture Patterns

### n8n Workflow Pattern (WF4)

The WF4 workflow follows the established pattern from WF3 with these key nodes:

```
Webhook Trigger (POST)
  |
  v
Validate Input & Log Run Start (Code + HTTP Request)
  |
  v
Fetch Approved Topic + Source Signals (HTTP Request x2)
  |
  v
Fetch Top Hooks from Hook Library (HTTP Request)
  |
  v
Assemble Context Package (Code)
  |
  v
Claude: Generate Content (HTTP Request to Anthropic API)
  |
  v
Parse Generation Response (Code)
  |
  v
Insert Post Draft (HTTP Request to Supabase)
  |
  v
Assign Calendar Slot (HTTP Request PATCH)
  |
  v
Slack Notification + Dashboard Badge (HTTP Request)
  |
  v
Log Run Complete (HTTP Request)

[Error Trigger → Log Error → Slack Error → Retry Once]
```

**Trigger Pattern:**
- Use n8n Webhook node (typeVersion 2) with `httpMethod: "POST"` and `path: "linkedin-content-generate"`
- Dashboard fires POST to `https://n8n.realtyamp.ai/webhook/linkedin-content-generate`
- Webhook responds immediately (200 OK with run_id) -- generation runs asynchronously
- Dashboard polls `workflow_runs` table for completion status
- This is the async pattern used in the existing waterfall-enrichment workflow

**Claude API Call Pattern (from WF3):**
```json
{
  "method": "POST",
  "url": "https://api.anthropic.com/v1/messages",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      { "name": "anthropic-version", "value": "2023-06-01" },
      { "name": "Content-Type", "value": "application/json" }
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={...prompt...}",
  "options": { "timeout": 120000 }
}
```
Credential: `anthropic-api` (ID: `anthropic-api`)

**Supabase REST Pattern (from WF3):**
```json
{
  "headerParameters": {
    "parameters": [
      { "name": "Content-Type", "value": "application/json" },
      { "name": "Prefer", "value": "return=representation" },
      { "name": "Accept-Profile", "value": "linkedin_engine" },
      { "name": "Content-Profile", "value": "linkedin_engine" }
    ]
  }
}
```
- Use `Accept-Profile: linkedin_engine` and `Content-Profile: linkedin_engine` on ALL requests
- Credential: `Dy6aCSbL5Tup4TnE` (Supabase REST httpHeaderAuth)
- Base URL: `https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/`

### Dashboard Pattern

The dashboard follows the exact pattern from Phase 4:

```
page.tsx (server component with Suspense)
  └── data-loader function (async, calls query functions)
       └── linkedin-content.tsx (client component, receives data as props)
            └── linkedin-skeleton.tsx (loading state)
```

**Query functions:** `dashboard/src/lib/api/linkedin-content-queries.ts`
**Mutation functions:** `dashboard/src/lib/api/linkedin-content-mutations.ts`
**API routes:** `dashboard/src/app/api/linkedin-content/`

**Existing API route pattern (from Phase 4):**
```typescript
// Route: /api/linkedin-content/topics/[id]/status
// Pattern: PATCH with JSON body, UUID validation, mutation function call
export async function PATCH(request: NextRequest, context: RouteContext) {
  // 1. Validate UUID format
  // 2. Parse JSON body
  // 3. Validate status value
  // 4. Call mutation function
  // 5. Return JSON response
}
```

**Mutation function pattern:**
```typescript
// Uses dot notation: .from('linkedin_engine.posts')
// Uses `as never` for untyped schema workaround
// Uses `as PostDb` for response type assertion
const { data, error } = await supabase
  .from('linkedin_engine.posts')
  .update(updateData as never)
  .eq('id', id)
  .select()
  .single();
```

### Recommended Project Structure
```
dashboard/src/app/
├── api/linkedin-content/
│   ├── topics/[id]/status/route.ts        # EXISTING (Phase 4)
│   ├── drafts/[id]/status/route.ts        # NEW - approve/reject draft
│   ├── drafts/[id]/hook/route.ts          # NEW - select hook variation
│   ├── drafts/[id]/edit/route.ts          # NEW - edit post text
│   ├── drafts/[id]/regenerate/route.ts    # NEW - trigger regeneration
│   └── drafts/[id]/calendar/route.ts      # NEW - assign/change calendar slot
├── dashboard/marketing/linkedin-content/
│   ├── page.tsx                            # EXISTING
│   ├── linkedin-content.tsx                # MODIFY - add Drafts tab content
│   └── linkedin-skeleton.tsx               # EXISTING

dashboard/src/lib/api/
├── linkedin-content-queries.ts             # MODIFY - add draft queries
└── linkedin-content-mutations.ts           # MODIFY - add draft mutations

n8n-workflows/linkedin-engine/
└── wf4-content-generation-pipeline.json    # NEW
```

### Anti-Patterns to Avoid
- **Never use n8n native Postgres or Supabase nodes** -- use HTTP Request + Supabase REST API only (established rule from Phase 1)
- **Never call Claude synchronously from the dashboard API route** -- always go through n8n webhook (keeps generation logic in n8n, enables retry/monitoring)
- **Never store 3 separate post rows for hook variations** -- wasteful, complicates queries. Use one row with JSONB for variations.
- **Never put the full PROMPT.md template hardcoded in the n8n HTTP Request body** -- build it in a Code node for readability and maintainability

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | `sonner` (already installed) | Already used in 10+ components in the codebase |
| Hook selection UI | Custom radio group | `@radix-ui/react-select` or tabs within card | Already installed, accessible, keyboard-navigable |
| Modal dialogs | Custom overlay | `@radix-ui/react-dialog` | Already installed, handles focus trapping, escape key, etc. |
| Optimistic updates | Custom state management | useState + fetch (same pattern as Phase 4 topic approve/reject) | Already proven in `handleStatusChange` |
| Async workflow tracking | Custom polling | Poll `workflow_runs` table via query function | Table already exists, WF3 already writes to it |
| Character count display | Manual counting | `string.length` with progress bar | LinkedIn posts are plain text, no special character handling needed |

**Key insight:** The entire dashboard toolkit is already available from prior phases. The Phase 5 dashboard work is feature work using existing patterns, not infrastructure work.

## Common Pitfalls

### Pitfall 1: Claude Response Parsing Failures
**What goes wrong:** Claude returns malformed JSON, markdown-wrapped JSON, or JSON with trailing text, causing the Code node parse to fail.
**Why it happens:** Despite "respond with ONLY valid JSON" instructions, LLMs occasionally add commentary.
**How to avoid:** Use the same defensive parsing from WF3 -- strip markdown fences, trim whitespace, have fallback values on parse error.
**Warning signs:** `JSON.parse` throwing in the Code node. Always wrap in try/catch with sensible defaults.

```javascript
// Proven pattern from WF3's Parse Clustering Response node
let result;
try {
  const responseText = claudeResponse.content?.[0]?.text || '{}';
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  result = JSON.parse(cleaned);
} catch (e) {
  // Fallback: log error, use defaults, mark for manual review
  result = { error: 'parse_failed', raw: responseText };
}
```

### Pitfall 2: Token Limits on Content Generation
**What goes wrong:** The content generation prompt is much larger than the scoring prompt (includes full brand voice, series definitions, pillar guidelines, example hooks). Combined with research context, it can approach token limits.
**Why it happens:** PROMPT.md template is 450+ lines. Context package (topic + signals + hooks) adds more.
**How to avoid:** Set `max_tokens: 4000` for the Claude API call (plenty for 3 hooks + full post + first comment). Truncate research signal body_text to 500 chars (same as WF3). Limit hook library examples to top 5. Use `claude-sonnet-4-20250514` which supports up to 8192 output tokens.
**Warning signs:** Claude truncating its response (check for `stop_reason: "max_tokens"` in the API response).

### Pitfall 3: Webhook Timeout on Long Generation
**What goes wrong:** Content generation takes 30-60 seconds. If the webhook waits for completion, the dashboard request times out.
**Why it happens:** Claude content generation for a full post with 3 hooks is significantly more work than topic scoring.
**How to avoid:** Use fire-and-forget pattern: webhook responds immediately with 200 + run_id, workflow continues asynchronously, dashboard polls `workflow_runs` for status. Set the webhook's Response parameter to "Immediately".
**Warning signs:** Dashboard showing loading spinner that never resolves, 504 gateway timeouts.

### Pitfall 4: Missing `pillar` in TypeScript Types
**What goes wrong:** The `PostDb` interface and `ContentCalendarDb` interface don't include `pillar` field. Code compiles but `pillar` data is silently dropped.
**Why it happens:** The `pillar` column was added via migration `20260213_linkedin_engine_pivot_updates.sql` but the TypeScript types in `linkedin-content-queries.ts` were never updated.
**How to avoid:** Add `pillar: string | null` to both `PostDb` and `ContentCalendarDb` interfaces in `linkedin-content-queries.ts` as part of Phase 5 work.
**Warning signs:** Pillar not showing in draft cards despite being set in n8n.

### Pitfall 5: RLS Permissions for Dashboard Operations
**What goes wrong:** Dashboard API route tries to INSERT a post row (e.g., regeneration creates new draft) but gets 403 from Supabase because authenticated role only has SELECT + UPDATE on posts table.
**Why it happens:** Current RLS policy: `service_role` has full access, `authenticated` has SELECT + UPDATE only (no INSERT or DELETE).
**How to avoid:** Two approaches: (a) Regeneration always goes through n8n webhook (recommended -- keeps write logic centralized), or (b) add INSERT policy for authenticated role via migration. Approach (a) is preferred because it maintains the existing architecture where n8n creates posts and the dashboard only reads/updates them.
**Warning signs:** 403 errors on POST requests to Supabase from dashboard mutations.

### Pitfall 6: Hook Variation Storage Model Confusion
**What goes wrong:** Storing 3 separate rows in `posts` table per topic creates confusion about which is the "active" draft and complicates queries.
**Why it happens:** The `posts` table has `hook_text`, `hook_category`, `hook_variation` columns suggesting one-hook-per-row design, but the content generation prompt generates 3 hooks with one full post text.
**How to avoid:** Store ONE row per topic. The `hook_text`, `hook_category`, `hook_variation` fields hold the SELECTED hook. Store all 3 hook variations in a new JSONB column `hook_variations` (array of {text, category, variation} objects). When user selects a different hook, update `hook_text`, `hook_category`, `hook_variation` from the JSONB array.
**Warning signs:** Multiple draft rows for the same topic cluttering the Drafts tab.

## Code Examples

### n8n Webhook Trigger Node Configuration
```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "linkedin-content-generate",
    "responseMode": "immediately",
    "responseData": "allEntries",
    "options": {}
  },
  "id": "wf4-webhook-trigger",
  "name": "Topic Approved Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [0, 400],
  "webhookId": "linkedin-content-generate"
}
```

### Dashboard Triggering WF4 (Next.js API Route)
```typescript
// In the topic approve handler, after updating status to 'approved':
// Fire-and-forget to n8n webhook
fetch('https://n8n.realtyamp.ai/webhook/linkedin-content-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic_id: id }),
}).catch((err) => {
  console.error('Failed to trigger WF4:', err);
  // Non-blocking: topic is approved even if webhook fails
  // User can manually retry from Drafts tab
});
```

### Claude Content Generation Prompt Assembly (n8n Code Node)
```javascript
// Assemble the context package for Claude
const topic = $json.topic;
const signals = $json.signals;
const topHooks = $json.top_hooks;
const calendarSlot = $json.calendar_slot;

const prompt = `You are writing a LinkedIn post for Mike Van Horn, "The HR Technologist."
// ... (full PROMPT.md template inserted here)

TOPIC: ${topic.topic_title}
ANGLE: ${topic.angle}
FORMAT: ${topic.recommended_format}
SERIES: ${topic.recommended_series}
PILLAR: ${calendarSlot.pillar || 'legacy_future'}
KEY DATA POINTS: ${JSON.stringify(topic.key_data_points)}
RESEARCH CONTEXT: ${signals.map(s => s.title + ': ' + (s.body_text || '').substring(0, 500)).join('\n')}
PRODUCT PHASE: Phase 1 (Current): The Ingestion Engine
HOOK PATTERNS TO CONSIDER: ${topHooks.map(h => h.hook_text).join('\n')}

// ... rules and output format from PROMPT.md
`;

return [{ json: { prompt, topic, signals } }];
```

### Draft Status Mutation (Dashboard)
```typescript
// In linkedin-content-mutations.ts
export async function updateDraftStatus(
  id: string,
  status: 'approved' | 'rejected' | 'draft'
): Promise<PostDb> {
  const supabase = getServerClient();
  const updateData: Record<string, unknown> = { status };

  const { data, error } = await supabase
    .from('linkedin_engine.posts')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to update draft status');
  return data as PostDb;
}
```

### Hook Selection Mutation (Dashboard)
```typescript
export async function selectHookVariation(
  id: string,
  variation: 'A' | 'B' | 'C',
  hookVariations: { text: string; category: string; variation: string }[]
): Promise<PostDb> {
  const supabase = getServerClient();
  const selected = hookVariations.find(h => h.variation === variation);
  if (!selected) throw new Error('Invalid hook variation');

  const { data, error } = await supabase
    .from('linkedin_engine.posts')
    .update({
      hook_text: selected.text,
      hook_category: selected.category,
      hook_variation: variation,
    } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to select hook');
  return data as PostDb;
}
```

### Slack Notification Pattern (from WF1)
```json
{
  "method": "POST",
  "url": "https://hooks.slack.com/services/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",
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\"text\": \"Content draft generated for: *{{ $json.topic_title }}*\\nSeries: {{ $json.series }}\\nPillar: {{ $json.pillar }}\\nHooks: 3 variations ready\\n<dashboard_url|Review in Dashboard>\"}"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Native n8n Postgres nodes | HTTP Request + Supabase REST API | Phase 1 decision | All WF nodes must use HTTP Request pattern |
| `.schema()` for custom Supabase schemas | Dot notation (`linkedin_engine.posts`) | Phase 4 (04-02) | Avoids TS errors, matches existing codebase |
| Separate data-loader.tsx file | Inline async function in page.tsx | Phase 4 pattern | Simpler structure, same Suspense behavior |
| Schedule-triggered generation | Webhook-triggered generation | Phase 5 (new) | Auto-generate on topic approval |
| Claude basic JSON prompting | Still using prompting (not structured outputs) | Current | Structured outputs beta requires `anthropic-beta` header; WF3 prompting pattern works well with fallback parsing |

**Note on Claude Structured Outputs:** As of late 2025, Anthropic offers structured JSON outputs via `output_format` parameter (beta). However, this requires an extra header (`anthropic-beta: structured-outputs-2025-11-13`) and only works with Sonnet 4.5+ or Opus 4.1+. Since the existing WF3 pattern of prompting for JSON + defensive parsing works reliably and uses `claude-sonnet-4-20250514`, stick with the existing approach. Upgrade to structured outputs when upgrading the model version.

## Schema Changes Needed

### Migration: Add `hook_variations` JSONB Column
```sql
-- Add hook_variations to store all 3 generated hook options
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS hook_variations JSONB;

COMMENT ON COLUMN linkedin_engine.posts.hook_variations IS
  'Array of hook objects: [{text, category, variation}] - stores all 3 generated hooks';

-- Add generation_status for tracking async generation state
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending';

COMMENT ON COLUMN linkedin_engine.posts.generation_status IS
  'Content generation status: pending, generating, completed, failed, regenerating';

-- Add generation_instructions for user-provided regeneration context
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS generation_instructions TEXT;

COMMENT ON COLUMN linkedin_engine.posts.generation_instructions IS
  'User instructions for content regeneration (e.g., "make it more data-driven")';
```

### TypeScript Type Updates Required
```typescript
// Add to PostDb interface in linkedin-content-queries.ts:
pillar: string | null;
hook_variations: { text: string; category: string; variation: string }[] | null;
generation_status: 'pending' | 'generating' | 'completed' | 'failed' | 'regenerating' | null;
generation_instructions: string | null;

// Add to ContentCalendarDb interface:
pillar: string | null;
```

### RLS Policy Addition (if dashboard needs INSERT on posts)
```sql
-- Only needed if regeneration creates new rows (not recommended)
-- Preferred approach: regeneration updates existing row via n8n
-- If needed:
DROP POLICY IF EXISTS "Authenticated insert posts" ON linkedin_engine.posts;
CREATE POLICY "Authenticated insert posts" ON linkedin_engine.posts
  FOR INSERT TO authenticated WITH CHECK (true);
GRANT INSERT ON linkedin_engine.posts TO authenticated;
```

## Open Questions

1. **Regeneration Architecture**
   - What we know: User can regenerate hooks, body, or full post with custom instructions
   - What's unclear: Should regeneration go through n8n (webhook call, same as initial generation) or directly call Claude from a Next.js API route?
   - Recommendation: Go through n8n for consistency. The dashboard PATCH route updates `generation_status` to 'regenerating' and `generation_instructions` to user text, then fires webhook to n8n. This keeps all Claude calls in n8n, enables monitoring via `workflow_runs`, and avoids RLS INSERT issues.

2. **Calendar Slot Assignment Timing**
   - What we know: CONTEXT.md says auto-assign based on series/day rules, Claude's discretion on timing
   - What's unclear: Should slot be assigned on topic approval (before content exists) or on draft creation (after content generated)?
   - Recommendation: Assign on draft creation. The calendar slot needs the series and pillar, which are confirmed during generation. Assigning on approval risks assigning the wrong slot if the series changes during generation.

3. **Dashboard Notification Badge**
   - What we know: CONTEXT.md requires "dashboard badge on the Drafts tab when generation completes"
   - What's unclear: How to implement real-time badge update without WebSocket
   - Recommendation: Poll `workflow_runs` for `wf4-content-generation-pipeline` status every 30 seconds while user is on the page. Use `revalidate` on page load. Show badge count on the Drafts TabsTrigger when there are new drafts since last view.

4. **Error Retry Mechanism**
   - What we know: CONTEXT.md says "auto-retry once, then alert via Slack and show error status"
   - What's unclear: How n8n handles retry of a webhook-triggered workflow
   - Recommendation: Build retry logic INTO the workflow itself: wrap the Claude call in a try/catch Code node, on failure set a retry flag and loop back to the Claude call. If second attempt fails, log error status and send Slack alert. This is more reliable than n8n's built-in retry mechanism which re-runs the entire workflow.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `n8n-workflows/linkedin-engine/wf3-topic-scoring-engine.json` -- full workflow pattern reference
- Codebase analysis: `dashboard/src/app/dashboard/marketing/linkedin-content/linkedin-content.tsx` -- 681 lines, Phase 4 dashboard pattern
- Codebase analysis: `dashboard/src/lib/api/linkedin-content-queries.ts` -- query patterns, type definitions
- Codebase analysis: `dashboard/src/lib/api/linkedin-content-mutations.ts` -- mutation patterns
- Codebase analysis: `dashboard/src/app/api/linkedin-content/topics/[id]/status/route.ts` -- API route pattern
- Codebase analysis: `supabase/migrations/20260208_create_linkedin_engine_schema.sql` -- full schema, RLS policies
- Codebase analysis: `supabase/migrations/20260213_linkedin_engine_pivot_updates.sql` -- pillar migration
- Codebase analysis: `.planning/linkedin-content-engine/PROMPT.md` -- content generation prompt template
- Codebase analysis: `.planning/linkedin-content-engine/phases/05-content-generation-drafts/05-CONTEXT.md` -- user decisions
- Codebase analysis: `dashboard/package.json` -- all available dependencies confirmed

### Secondary (MEDIUM confidence)
- [n8n Webhook node docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) -- webhook configuration, response modes
- [Claude API Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- beta feature reference (not using, but noted)
- [Claude API Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) -- model IDs, capabilities

### Tertiary (LOW confidence)
- Web search results on n8n async webhook patterns -- confirmed with existing waterfall-enrichment.json codebase pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in use in prior phases, no new dependencies
- Architecture: HIGH -- patterns directly extracted from WF3 and Phase 4 dashboard code
- Pitfalls: HIGH -- identified from actual codebase analysis (missing types, RLS policies, etc.)
- Schema changes: HIGH -- derived from gap analysis between PROMPT.md requirements and existing schema
- Webhook trigger: MEDIUM -- pattern inferred from waterfall-enrichment.json + n8n docs

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable -- all patterns are established in this codebase)
