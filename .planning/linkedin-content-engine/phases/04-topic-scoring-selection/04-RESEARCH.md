# Phase 4: Topic Scoring & Selection - Research

**Researched:** 2026-02-13
**Domain:** n8n workflow orchestration, Claude AI scoring, Next.js dashboard interactivity
**Confidence:** HIGH

## Summary

Phase 4 builds two components: (1) an n8n workflow (WF3) that fetches unprocessed research signals, clusters them into topics, scores each topic across 5 dimensions (0-100), and inserts scored topics into the `topic_recommendations` table; and (2) interactive dashboard UI enhancements to the existing "This Week" tab enabling approve/reject with an API route.

The key technical challenges are signal-to-topic clustering (individual articles/posts must be grouped into thematic topics before scoring), AI-powered scoring for subjective dimensions (content gap and positioning alignment require Claude judgment), and the dashboard interaction pattern (approve/reject buttons with optimistic UI updates).

**Primary recommendation:** Use a two-pass Claude approach in the n8n workflow -- first pass clusters signals into topics, second pass scores each topic across the 5 dimensions. Use structured JSON output for reliable parsing. Dashboard uses Next.js API route with the existing mutation pattern (queries file + mutations file + route handler).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| n8n | Self-hosted | Workflow orchestration for WF3 | Already deployed at n8n.realtyamp.ai |
| Claude Sonnet API | claude-sonnet-4-20250514 | Topic clustering, gap analysis, positioning scoring | Already used in WF1/WF2, credential configured |
| Supabase REST API | PostgREST | n8n data access (read signals, write topics) | Mandated by prior decision (no Postgres nodes) |
| Next.js 16 | 16.x | Dashboard API routes and page | Existing dashboard framework |
| React 19 | 19.x | Interactive UI components | Existing dashboard framework |
| supabase-js | @supabase/supabase-js | Dashboard database access | Existing server client singleton |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons for approve/reject buttons | Already imported in linkedin-content.tsx |
| Radix UI | existing | Button, Dialog components | Already used in dashboard-kit |
| Tailwind CSS | existing | Styling | Already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two-pass Claude (cluster then score) | Single-pass Claude (score raw signals) | Single-pass is simpler but cannot properly cluster signals into topics -- scoring individual signals produces duplicates and misses multi-signal themes |
| Structured JSON output | Raw JSON in prompt | Structured output (output_config.format) guarantees valid JSON, eliminates parsing failures. However, requires direct API call not n8n's built-in AI nodes |
| API route for approve/reject | Server Action | API route follows existing codebase patterns (tasks, contacts) and is compatible with potential future mobile/API consumers |

**Installation:**
No new packages required. All dependencies exist in the dashboard.

## Architecture Patterns

### n8n Workflow Structure (WF3: Topic Scoring Engine)

```
Schedule (Monday 5 AM CST)
  |
  v
Fetch Unprocessed Signals (GET /rest/v1/research_signals?processed=eq.false&signal_week=eq.{thisWeek})
  |
  v
Check Has Signals? (If node)
  |
  v
Claude Pass 1: Cluster Signals into Topics (POST /v1/messages)
  |  - Input: All unprocessed signals as JSON array
  |  - Output: Array of topic clusters, each with topic_title, angle, signal_ids[]
  |  - Use structured JSON output for guaranteed parsing
  |
  v
Split Topics (Code node: parse Claude response into individual items)
  |
  v
SplitInBatches (process 1 topic at a time)
  |
  v
Claude Pass 2: Score Each Topic (POST /v1/messages)
  |  - Input: Topic cluster + its constituent signals
  |  - Output: 5 dimension scores + recommended_format + recommended_series + hook_suggestion
  |  - Scores: engagement (0-25), freshness (0-25), gap (0-20), positioning (0-15), format (0-15)
  |  - AEO bonus applied within positioning score
  |
  v
Parse & Calculate Total Score (Code node)
  |  - Sum all 5 dimension scores
  |  - Validate score ranges
  |  - Assemble insert payload
  |
  v
Insert Topic Recommendation (POST /rest/v1/topic_recommendations)
  |
  v
[Loop back to SplitInBatches]
  |
  v (done)
Mark Signals Processed (PATCH /rest/v1/research_signals?id=in.(...))
  |
  v
Log Workflow Run (POST /rest/v1/workflow_runs)

Error Trigger -> Log Error (canary pattern)
```

### Dashboard File Structure

```
dashboard/src/
├── app/
│   ├── api/
│   │   └── linkedin-content/
│   │       └── topics/
│   │           └── [id]/
│   │               └── status/
│   │                   └── route.ts          # PATCH endpoint for approve/reject
│   └── dashboard/
│       └── marketing/
│           └── linkedin-content/
│               ├── page.tsx                  # Existing (no changes)
│               ├── linkedin-content.tsx      # UPDATE: Add interactive "This Week" tab
│               └── linkedin-skeleton.tsx     # Existing (no changes)
├── lib/
│   ├── api/
│   │   ├── linkedin-content-queries.ts      # UPDATE: Fix schema access, add getTopicById
│   │   └── linkedin-content-mutations.ts    # NEW: updateTopicStatus mutation
│   └── supabase/
│       └── server.ts                        # Existing (no changes)
```

### Pattern 1: Signal-to-Topic Clustering via Claude

**What:** Use Claude to analyze all unprocessed signals for a given week and cluster them into 6-10 distinct topics. Each topic gets a title, angle, and list of source signal IDs.

**When to use:** When raw data items (signals) need to be grouped into higher-level themes before scoring.

**Why Claude for clustering (not algorithmic):** The signals are heterogeneous (RSS articles, Reddit posts, LinkedIn posts) with different formats and vocabulary. Semantic clustering requires understanding the substance of each signal, not just keyword overlap. Claude can identify that an EEOC press release about AI hiring bias and a Reddit thread about "got rejected by an AI screener" are the same topic.

**Example prompt:**
```
You are analyzing research signals for a LinkedIn content engine targeting HR professionals interested in AI.

Here are this week's research signals:

{signals_json}

Group these signals into 6-10 distinct TOPIC CLUSTERS. Each topic should represent a single coherent theme that could become one LinkedIn post.

Rules:
- A signal can belong to only one topic
- Topics should be specific enough for a single LinkedIn post (not "AI in HR" -- too broad)
- Each topic needs a clear, specific angle that differentiates it
- Prioritize topics where multiple signals converge (stronger signal = better topic)
- Include the source signal IDs for each topic so we can trace back

For each topic provide:
- topic_title: Specific, actionable title (not generic)
- angle: The unique perspective or hook for this topic
- signal_ids: Array of signal UUIDs that support this topic
- key_data_points: 2-3 specific facts/stats from the signals
```

### Pattern 2: Multi-Dimensional Scoring via Claude

**What:** For each clustered topic, Claude evaluates 5 scoring dimensions and returns structured scores with reasoning.

**When to use:** When scoring requires subjective judgment (gap analysis, positioning alignment) alongside data-driven metrics (engagement, freshness).

**Key insight:** Three dimensions can be partially computed from data (engagement signal, freshness), but two dimensions REQUIRE AI judgment (content gap analysis, positioning alignment). Format potential also benefits from AI assessment. Therefore, score ALL dimensions via Claude but provide the raw engagement data and dates as context so Claude can apply the rubric accurately.

**Example prompt for scoring:**
```
Score this topic for a LinkedIn content engine. The author is Mike Van Horn, "The HR Technologist" (CEO of IAML, a 45-year employment law training company). He sits at the intersection of AI expertise and HR/employment law.

TOPIC: {topic_title}
ANGLE: {angle}
SOURCE SIGNALS: {signals_with_engagement_data}
KEY DATA POINTS: {key_data_points}
TODAY'S DATE: {today}

Score across exactly 5 dimensions using these rubrics:

1. ENGAGEMENT SIGNAL STRENGTH (0-25):
   - Reddit post 100+ upvotes: +5
   - Reddit post 50+ comments: +5
   - X post 500+ likes from HR account: +5
   - 3+ sources covering same topic: +5
   - Google Trends "rising" for keyword: +5

2. FRESHNESS & TIMING (0-25):
   - Regulatory announcement in past 48 hrs: +10
   - Court decision in past 7 days: +8
   - Trending in past 3 days: +7
   - 4-7 days old but still growing: +5
   - Evergreen with new data/angle: +3

3. CONTENT GAP ANALYSIS (0-20):
   - No LinkedIn posts found on this angle: +10
   - Existing posts are low-quality/surface: +7
   - Topic covered but Mike's AI angle is unique: +5
   - Well-covered by multiple leaders: +0

4. POSITIONING ALIGNMENT (0-15 + up to 3 AEO bonus):
   - Directly AI + HR/employment law: +15
   - AI-adjacent with clear HR implications: +10
   - HR topic where AI angle can be added: +7
   - General HR without AI connection: +3
   - AEO bonus: +3 if topic naturally allows use of terms: "Agentic RAG", "Compliance Guardrails", "Multi-Agent Orchestration", "HR Agentic Systems"

5. FORMAT POTENTIAL (0-15):
   - Complex topic perfect for carousel: +10
   - Contrarian angle ideal for text-only: +8
   - Data-heavy for visual: +7
   - Story/narrative opportunity: +5
   - Simple topic: +2

Also recommend:
- format: one of "text", "carousel", "data_graphic"
- series: one of "not_being_told", "compliance_radar", "ask_ai_guy", "flex"
- hook_suggestion: A 1-2 sentence hook for this topic
```

### Pattern 3: Dashboard Approve/Reject with Optimistic UI

**What:** Add approve/reject buttons to each topic card in the "This Week" tab. Use client-side state for immediate feedback, with API call to persist.

**When to use:** When users need to make quick approval decisions on a list of items.

**Implementation pattern:**
```typescript
// Client component with state management
const [topicStatuses, setTopicStatuses] = useState<Record<string, string>>({});

async function handleStatusChange(topicId: string, newStatus: 'approved' | 'rejected') {
  // Optimistic update
  setTopicStatuses(prev => ({ ...prev, [topicId]: newStatus }));

  try {
    const res = await fetch(`/api/linkedin-content/topics/${topicId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error('Failed to update');
    // Optionally revalidate
    router.refresh();
  } catch {
    // Revert on failure
    setTopicStatuses(prev => ({ ...prev, [topicId]: 'pending' }));
  }
}
```

### Anti-Patterns to Avoid

- **Scoring individual signals instead of topics:** Produces duplicate recommendations and misses multi-signal themes. Always cluster first, then score the cluster.
- **Using n8n Postgres nodes:** Known connection pooling bugs. Use HTTP Request + Supabase REST API exclusively.
- **Hardcoding score thresholds in n8n:** Keep the scoring rubric in the Claude prompt, not in n8n Code nodes. This makes the rubric easy to update without modifying the workflow.
- **Single Claude call for everything:** Trying to cluster AND score in one pass leads to confused outputs and makes it impossible to iterate on clustering vs scoring independently.
- **Using `validateApiKey` for dashboard routes:** The existing API key auth pattern is for external API consumers (mobile app). Dashboard routes accessed from the same Next.js app do not need API key auth -- they run server-side or use the existing Supabase session.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing from Claude | Manual regex/string parsing | Claude structured outputs (`output_config.format`) | Guarantees valid JSON, eliminates parsing failures entirely |
| Score validation | Custom range-checking code in n8n | JSON schema constraints in structured output + Code node validation | Let Claude's structured output enforce types, then validate ranges |
| Topic deduplication | Complex string matching | Claude clustering (semantic dedup) | Claude understands that "AI hiring bias EEOC" and "automated screening discrimination" are the same topic |
| Week-of calculation | Custom date logic per node | Reusable Code node function | Same `getMondayOfWeek()` pattern used in WF1 and WF2 |
| Dashboard state management | Custom React state library | useState + fetch + router.refresh() | Simple approve/reject doesn't warrant Redux/Zustand complexity |

**Key insight:** The scoring algorithm itself should live in the Claude prompt, not as programmatic logic in n8n. The rubric has qualitative dimensions (gap analysis, positioning) that require AI judgment. Putting the rubric in the prompt means updates are text changes, not workflow changes.

## Common Pitfalls

### Pitfall 1: Supabase Schema Access in Dashboard Queries
**What goes wrong:** Current queries use `.from('linkedin_engine.topic_recommendations')` which is PostgREST dot notation. The official supabase-js API uses `.schema('linkedin_engine').from('topic_recommendations')`.
**Why it happens:** Dot notation may work if the schema is exposed and PostgREST accepts it, but it's not the documented supabase-js API.
**How to avoid:** For new mutations, use `.schema('linkedin_engine').from('topic_recommendations')`. If the existing dot-notation queries are working (Phase 1 was validated), keep consistency but note this for future refactoring.
**Warning signs:** 404 errors or empty results from Supabase queries on linkedin_engine tables.

### Pitfall 2: Claude Token Limits on Signal Batching
**What goes wrong:** Sending all signals in one Claude call can exceed context limits. A week's worth of signals could be 50-200 items with body text.
**Why it happens:** Each signal has title + body_text (up to 5000 chars each). 100 signals x 5000 chars = 500K chars, well beyond context.
**How to avoid:** Truncate body_text to 500 chars per signal for clustering (title + snippet is sufficient for topic identification). For scoring, include only the signals relevant to that specific topic (typically 2-7 signals).
**Warning signs:** Claude API 400 errors with "input too long" message.

### Pitfall 3: Engagement Data Availability
**What goes wrong:** The scoring rubric references engagement thresholds (100+ upvotes, 500+ likes) but not all signals have platform_engagement data. RSS signals from WF1 have empty `platform_engagement: {}`.
**Why it happens:** RSS feeds don't include engagement metrics. Only WF2 (Reddit/LinkedIn) captures engagement data.
**How to avoid:** Instruct Claude that RSS signals have no engagement data and to score engagement based on multi-source coverage (+5 for 3+ sources) rather than individual metrics. A topic backed by 4 RSS articles from different sources gets engagement points even without upvote data.
**Warning signs:** All topics scoring 0 on engagement because RSS signals lack upvotes.

### Pitfall 4: Race Condition on Signal Processing
**What goes wrong:** WF3 marks signals as `processed=true` after scoring. If WF1 or WF2 runs concurrently and inserts new signals, those signals could be fetched by WF3 but not yet processed by the time WF3 marks everything done.
**Why it happens:** WF3 runs Monday 5 AM; WF1 runs daily at 6 AM. They shouldn't overlap, but manual triggers could cause races.
**How to avoid:** Fetch signal IDs at the start, process them, then mark only THOSE specific IDs as processed (using `id=in.(...)` filter), not a blanket `processed=eq.false` update.
**Warning signs:** Signals skipped (never scored) or scored twice.

### Pitfall 5: Score Range Overflow with AEO Bonus
**What goes wrong:** Positioning alignment is 0-15 but AEO bonus adds +3, making the effective max 18. This means total_score can exceed 100 (max would be 103).
**Why it happens:** The PROMPT.md scoring algorithm defines positioning as 0-15 with a +3 bonus on top.
**How to avoid:** This is by design per the requirements (SCORE-02). The positioning_score column stores the raw value (up to 18). total_score is the sum of all dimensions and can exceed 100. Document this clearly in the README. Do NOT cap at 100 -- the AEO bonus is intentionally a differentiator.
**Warning signs:** Users confused by scores over 100.

### Pitfall 6: Empty Week with No Signals
**What goes wrong:** If WF1 and WF2 haven't run yet (or produced no signals), WF3 has nothing to score and should exit gracefully.
**Why it happens:** Phase 2 and 3 workflows are still awaiting n8n import. WF3 may run before any signals exist.
**How to avoid:** Add an If node after fetching signals to check if the array is empty. If empty, log a workflow run with `items_processed: 0` and exit. Do NOT create an error.
**Warning signs:** Error entries in workflow_errors when there are simply no signals to process.

## Code Examples

### n8n: Fetch Unprocessed Signals for Current Week

```javascript
// Code node: Calculate week and build Supabase URL
const now = new Date();
const day = now.getDay();
const diff = now.getDate() - day + (day === 0 ? -6 : 1);
const monday = new Date(now);
monday.setDate(diff);
const signalWeek = monday.toISOString().split('T')[0];
const weekOf = signalWeek; // Use same value for topic_recommendations.week_of

return [{
  json: {
    signal_week: signalWeek,
    week_of: weekOf,
    fetch_url: `https://htmnsoqkwtfshavqxlrm.supabase.co/rest/v1/research_signals?processed=eq.false&signal_week=eq.${signalWeek}&select=id,source,source_url,title,body_text,author,platform_engagement,keywords,topic_category,sentiment,collected_date`
  }
}];
```

### n8n: Claude Structured Output for Topic Clustering (HTTP Request body)

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4000,
  "messages": [
    {
      "role": "user",
      "content": "Group these HR/AI research signals into 6-10 topic clusters...\n\nSignals:\n{{ JSON.stringify($json.signals) }}"
    }
  ],
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "topics": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "topic_title": { "type": "string" },
                "angle": { "type": "string" },
                "signal_ids": { "type": "array", "items": { "type": "string" } },
                "key_data_points": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["topic_title", "angle", "signal_ids", "key_data_points"],
              "additionalProperties": false
            }
          }
        },
        "required": ["topics"],
        "additionalProperties": false
      }
    }
  }
}
```

**Important:** The `output_config.format` parameter with `json_schema` type is generally available on Claude Sonnet 4.5 and Opus 4.6. For claude-sonnet-4-20250514, verify compatibility. If not supported, fall back to prompt-based JSON with parsing (the WF1/WF2 pattern).

### n8n: Claude Structured Output for Topic Scoring (HTTP Request body)

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1500,
  "messages": [
    {
      "role": "user",
      "content": "Score this topic for the LinkedIn Content Engine...\n\nTOPIC: {{ $json.topic_title }}\nANGLE: {{ $json.angle }}\nSIGNALS: {{ JSON.stringify($json.signals) }}\nTODAY: {{ $now.format('YYYY-MM-DD') }}"
    }
  ],
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "engagement_score": { "type": "integer" },
          "freshness_score": { "type": "integer" },
          "gap_score": { "type": "integer" },
          "positioning_score": { "type": "integer" },
          "format_score": { "type": "integer" },
          "recommended_format": { "type": "string" },
          "recommended_series": { "type": "string" },
          "hook_suggestion": { "type": "string" },
          "scoring_rationale": { "type": "string" }
        },
        "required": ["engagement_score", "freshness_score", "gap_score", "positioning_score", "format_score", "recommended_format", "recommended_series", "hook_suggestion", "scoring_rationale"],
        "additionalProperties": false
      }
    }
  }
}
```

### Dashboard: API Route for Topic Status Update

```typescript
// /api/linkedin-content/topics/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['approved', 'rejected', 'pending'] as const;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid topic ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: approved, rejected, or pending', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();
    const updateData: Record<string, unknown> = { status };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.approved_at = null;
    }

    const { data, error } = await supabase
      .schema('linkedin_engine')
      .from('topic_recommendations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Topic status update error:', error);
      return NextResponse.json(
        { error: 'Failed to update topic status', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Topic status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

### Dashboard: Interactive Topic Card with Score Breakdown

```typescript
// Inside linkedin-content.tsx "This Week" tab
function TopicCard({ topic, onStatusChange }: {
  topic: TopicRecommendationDb;
  onStatusChange: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const dimensions = [
    { label: 'Engagement', score: topic.engagement_score, max: 25 },
    { label: 'Freshness', score: topic.freshness_score, max: 25 },
    { label: 'Content Gap', score: topic.gap_score, max: 20 },
    { label: 'Positioning', score: topic.positioning_score, max: 15 },
    { label: 'Format', score: topic.format_score, max: 15 },
  ];

  return (
    <div className="p-4 rounded-lg bg-background-card-light border border-border">
      {/* Topic header with title, angle, status */}
      {/* Score breakdown bars */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {dimensions.map(d => (
          <div key={d.label} className="text-center">
            <div className="text-xs text-muted-foreground">{d.label}</div>
            <div className="text-sm font-medium">{d.score ?? 0}/{d.max}</div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="bg-accent-primary rounded-full h-1.5"
                style={{ width: `${((d.score ?? 0) / d.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Approve/Reject buttons */}
      <div className="flex gap-2 mt-4">
        {topic.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusChange(topic.id, 'approved')}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => onStatusChange(topic.id, 'rejected')}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prompt-based JSON ("Return ONLY valid JSON") | Structured outputs (`output_config.format`) | Nov 2025 (GA) | Guarantees valid JSON, eliminates parsing failures |
| `output_format` parameter | `output_config.format` parameter | Recent (2025 deprecation) | Old parameter still works but is deprecated |
| n8n Aggregate node for grouping | n8n Summarize node for group-by | n8n v1.107+ | Summarize node has proper group-by functionality; Aggregate lacks it |
| supabase-js dot notation (`from('schema.table')`) | supabase-js `.schema('schema').from('table')` | Supabase current | `.schema()` is the documented API; dot notation may work via PostgREST but is not officially supported |
| Beta header for structured outputs | No header needed (GA) | Late 2025 | `anthropic-beta: structured-outputs-2025-11-13` no longer required |

**Deprecated/outdated:**
- `output_format` parameter: Use `output_config.format` instead (still works temporarily)
- `anthropic-beta: structured-outputs-2025-11-13` header: No longer needed since GA
- n8n Aggregate node for group-by: Use Summarize node instead (Aggregate lacks group-by)

## Open Questions

Things that could not be fully resolved:

1. **Claude Sonnet model ID and structured output support**
   - What we know: Structured outputs are GA on Claude Sonnet 4.5, Opus 4.6, Opus 4.5, Haiku 4.5
   - What's unclear: Whether `claude-sonnet-4-20250514` (the model ID used in WF1/WF2) supports `output_config.format`, or if a newer model ID is needed
   - Recommendation: Test with the existing model ID. If structured outputs fail, fall back to prompt-based JSON parsing (the proven WF1/WF2 pattern). Both approaches work; structured output is a quality-of-life improvement, not a requirement.

2. **Supabase dot notation vs .schema() method**
   - What we know: Existing queries use `.from('linkedin_engine.topic_recommendations')` and Phase 1 was validated as working
   - What's unclear: Whether dot notation is officially supported by supabase-js or just happens to work via PostgREST passthrough
   - Recommendation: For NEW code (mutations), use `.schema('linkedin_engine').from('topic_recommendations')`. Keep existing queries consistent for now. If the `.schema()` approach fails, fall back to dot notation.

3. **Signal volume per week**
   - What we know: WF1 runs daily (7 feeds), WF2 runs weekly (7 subreddits + LinkedIn). Estimated 50-200 signals per week.
   - What's unclear: Actual signal volume won't be known until WF1/WF2 are imported and tested
   - Recommendation: Design for up to 200 signals. Truncate body_text to 500 chars for clustering to stay within Claude context limits. If volume exceeds 200, add a pre-filter (e.g., only signals with certain topic_categories or minimum engagement).

4. **Anthropic API version header for structured outputs**
   - What we know: Structured outputs use `anthropic-version: 2023-06-01` (same as existing)
   - What's unclear: Whether the `output_config` parameter works with the 2023-06-01 API version or requires a newer version string
   - Recommendation: Start with `2023-06-01`. If `output_config` is rejected, try without it and use prompt-based JSON.

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - Full structured outputs API reference, GA availability, JSON schema format, output_config.format parameter
- [Supabase Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas) - Accept-Profile, Content-Profile headers, .schema() method, db.schema option
- Existing codebase files:
  - `dashboard/src/lib/api/linkedin-content-queries.ts` - Current query patterns, TopicRecommendationDb type
  - `dashboard/src/app/dashboard/marketing/linkedin-content/linkedin-content.tsx` - Current "This Week" tab UI
  - `.planning/linkedin-content-engine/PROMPT.md` - Scoring algorithm, content series, AEO terms
  - `.planning/linkedin-content-engine/phases/02/PLAN.md` - WF1 node patterns (reference architecture)
  - `.planning/linkedin-content-engine/phases/03/PLAN.md` - WF2 node patterns (reference architecture)
  - `dashboard/src/lib/api/task-mutations.ts` - Mutation pattern reference
  - `dashboard/src/app/api/tasks/[id]/complete/route.ts` - API route pattern reference

### Secondary (MEDIUM confidence)
- [n8n Aggregate Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.aggregate/) - Aggregate vs Summarize node capabilities
- [n8n Community: Aggregate function with grouping](https://community.n8n.io/t/aggregate-function-w-grouping/174504) - Confirmed Summarize node is the correct choice for group-by operations
- [Supabase Discussion: Custom schemas with JS client](https://github.com/orgs/supabase/discussions/21511) - .schema() per-query method, dot notation not officially documented

### Tertiary (LOW confidence)
- [n8n Community: Emerging patterns for hybrid automation](https://community.n8n.io/t/when-workflows-meet-agents-emerging-patterns-for-hybrid-automation-in-2025/157805) - General n8n AI workflow patterns (not specific to scoring)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools/libraries are already in use in the project; no new dependencies needed
- Architecture (n8n workflow): HIGH - Follows established WF1/WF2 patterns with clear node layout; two-pass Claude approach is well-understood
- Architecture (dashboard): HIGH - Follows existing page.tsx -> content.tsx pattern and existing API route/mutation patterns from tasks, contacts
- Pitfalls: HIGH - Based on direct codebase analysis and understanding of Supabase REST API behavior
- Scoring prompts: MEDIUM - Prompt design is based on best practices but will need tuning based on actual signal data
- Structured outputs compatibility: MEDIUM - GA for current Claude models, but exact model ID compatibility with claude-sonnet-4-20250514 unverified

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (stable domain -- n8n, Supabase, and Claude API patterns are mature)
