# Phase 11: AI Integration - Research

## Summary

Phase 11 is well-positioned to succeed. The existing infrastructure already supports most AI functionality:

- **Tasks table** already has `ai_confidence` and `ai_suggested_at` columns
- **"AI Suggested" view** exists with `source='ai'` filtering (built in Phase 4)
- **Claude API integration** exists in mobile chat (Anthropic SDK configured)
- **Scheduled workflow pattern** proven with daily digest workflow (n8n cron)
- **Email infrastructure** in place (React Email templates + Resend)

**Key insight:** Phase 11 focuses on **suggestion generation logic** (n8n workflow + Claude API) and **dashboard widget display**, NOT modifying existing task creation or filtering (already works).

---

## Existing Infrastructure

### Database Support (Already Complete)

The tasks table already has AI-specific columns:

| Column | Type | Purpose |
|--------|------|---------|
| `ai_confidence` | NUMERIC(3,2) | Confidence score (0.00-1.00) |
| `ai_suggested_at` | TIMESTAMPTZ | When suggestion was created |
| `source` | TEXT | Already supports 'ai' value |
| `status` | TEXT | 'open' for pending suggestions |
| `dismissed_reason` | TEXT | For rejection reasons |
| `dedupe_key` | TEXT | Prevents duplicate AI suggestions |

**No schema changes needed** — all AI fields exist.

### UI Support (Already Complete)

| Component | Location | Status |
|-----------|----------|--------|
| AI Suggested view | `view-tabs.tsx` | Ready (filters `source='ai'`) |
| Badge counts | `action-center-content.tsx` | Ready (counts ai-suggested tasks) |
| Task list table | `task-table.tsx` | Ready (displays AI suggestions like normal tasks) |
| Task detail page | `task-detail-content.tsx` | Ready (shows source, can add confidence) |
| Task mutations | Existing APIs | Ready (updateTask, dismissTask, etc.) |

### Claude Integration (Already Complete)

**Location:** `/dashboard/src/lib/api/mobile-chat.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  system: 'You are analyzing task data...',
  messages: [{ role: 'user', content: prompt }]
});
```

Phase 8 already uses Claude for alert title transformation — proves the pattern works.

### Scheduled Workflow Pattern (Proven)

**Example:** Daily Digest Sender (`daily-digest-sender.json`)

Pattern:
1. Schedule trigger (cron)
2. Data fetch from Supabase
3. Transform/analyze
4. External API call (Resend for email, Claude for AI)
5. Log results to Slack

---

## Database Findings

### Data Available for 90-Day Pattern Analysis

```sql
-- Tasks table provides:
- created_at         -- Task creation timestamp
- completed_at       -- Completion timestamp (velocity calculation)
- dismissed_at       -- Dismissal timestamp (neglect patterns)
- dismissed_reason   -- Why dismissed (learning data)
- priority           -- Current priority
- status             -- Task state
- task_type          -- Type patterns
- due_date           -- Deadline clustering
- workflow_id        -- Workflow context

-- Supporting data:
- task_comments      -- For rejection reasoning
- task_activity      -- Full event history
```

### Query for Pattern Analysis

```sql
SELECT id, title, status, priority, due_date,
       created_at, completed_at, dismissed_at,
       dismissed_reason, task_type, workflow_id
FROM action_center.tasks
WHERE created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC
```

---

## UI/Component Findings

### What Exists

1. **AI Suggested View** (`view-tabs.tsx`)
   - Filter: `source: ['ai']` AND `status: ['open']`
   - Badge count tracked
   - Shows pending suggestions

2. **Task Table** (`task-table.tsx`)
   - Displays all task attributes
   - Can add confidence score column

3. **Task Detail** (`task-detail-content.tsx`)
   - Full task display
   - Can add "Suggested by AI" indicator

### What's Missing (Phase 11 Scope)

1. **Weekly Focus Widget** — New dashboard card showing AI analysis summary
2. **Confidence Score Display** — Badge/indicator on task rows
3. **Accept/Reject Flow** — Simple mutations with optional reason
4. **Rejection Reason Picker** — Quick-select options + free text

### Component Pattern to Follow

Dashboard widgets follow this pattern:
- Load data via Suspense/loader
- Use Card component from dashboard-kit
- Display metrics and CTAs
- Link to full list view

---

## AI Integration Findings

### Recommended Approach

1. **n8n workflow** for scheduled AI analysis (not API endpoint)
2. **Claude API** called via HTTP request node in n8n
3. **Insert suggestions** directly via Supabase Postgres node
4. **Dashboard widget** fetches suggestions via existing task queries

### Claude Model Selection

| Model | Use Case | Recommendation |
|-------|----------|----------------|
| `claude-opus-4-5-20251101` | Most capable, best reasoning | **Use for weekly analysis** |
| `claude-sonnet-4-5-20250929` | Faster, cheaper | Use for realtime features |

Since AI Focus runs weekly (not realtime), use opus for best quality.

### Prompt Structure

```
System: You are an encouraging task coach analyzing 90 days of work patterns.
Your role is to identify opportunities, suggest improvements, and celebrate progress.
Respond with JSON containing suggested actions.

User: Based on these tasks: {task_data}, provide up to 10 suggestions including:
- New tasks that should be created
- Priority changes for existing tasks
- Due date recommendations
- Patterns you noticed

Format each suggestion with confidence (0-100) and reasoning if confidence < 80.
```

---

## n8n Workflow Findings

### Workflow Structure: "Weekly AI Focus Generator"

**Trigger:** Schedule node (`0 19 * * 0` for Sunday 7pm, `0 17 * * 5` for Friday 5pm)

**Nodes:**
1. **Schedule Trigger** — Cron for Sunday evening + Friday recap
2. **Fetch Task Data** — Supabase Postgres query (90-day history)
3. **Aggregate Patterns** — Code node for data preparation
4. **Call Claude API** — HTTP request to Anthropic API
5. **Parse Response** — Code node to extract suggestions
6. **Create Suggestions** — Loop: Insert each as task with `source='ai'`
7. **Create Weekly Focus Task** — Summary task with analysis
8. **Update Dashboard Widget** — Store summary for widget display
9. **Error Handler** — Slack notification on failure

### Schedule Configuration

Per context decisions:
- **Sunday evening** — Weekly planning (`0 19 * * 0` = 7pm Sunday)
- **Friday recap** — Weekly reflection (`0 17 * * 5` = 5pm Friday)

---

## Pattern Detection Algorithms

### 1. Recurring Neglect
```javascript
// Tasks dismissed or overdue 3+ times with same type
const neglectedTypes = tasks
  .filter(t => t.dismissed_at || isOverdue(t))
  .groupBy('task_type')
  .filter(group => group.length >= 3);
```

### 2. Workload Imbalance
```javascript
// Days with >5 tasks due vs days with 0
const tasksByDueDate = tasks.groupBy('due_date');
const overloadedDays = Object.entries(tasksByDueDate)
  .filter(([date, tasks]) => tasks.length > 5);
```

### 3. Completion Velocity
```javascript
// Average days from creation to completion
const velocities = completedTasks.map(t =>
  daysBetween(t.created_at, t.completed_at)
);
const avgVelocity = average(velocities);
// Flag if trending slower (last 30d avg > 90d avg)
```

### 4. Deadline Clustering
```javascript
// Multiple high-priority tasks due same day
const clustering = upcomingTasks
  .filter(t => t.priority in ['critical', 'high'])
  .groupBy('due_date')
  .filter(group => group.length >= 2);
```

---

## Recommendations

### 1. Create Single n8n Workflow
"Weekly AI Focus Generator" handles both Sunday planning and Friday recap via schedule trigger.

### 2. Dashboard Widget Component
New file: `dashboard/src/components/widgets/weekly-focus-widget.tsx`
- Shows this week's AI summary
- Top 3 suggestions with accept/dismiss actions
- "View all suggestions" link

### 3. Suggestion Storage Pattern
Store in existing tasks table:
```sql
INSERT INTO action_center.tasks (
  title, description, status, priority, source,
  ai_confidence, ai_suggested_at, dedupe_key
) VALUES (
  'Suggested: Review overdue marketing tasks',
  'AI detected 5 overdue marketing tasks from last 2 weeks...',
  'open', 'normal', 'ai',
  0.85, NOW(), 'ai:neglect:marketing:2026-01-25'
);
```

### 4. Weekly Focus Summary Storage
Create "Weekly Focus Review" task with analysis in description:
```sql
INSERT INTO action_center.tasks (
  title, description, task_type, status, priority, source
) VALUES (
  'Weekly Focus Review - Jan 27, 2026',
  '## This Week''s Focus\n\nGreat progress last week!...',
  'review', 'open', 'normal', 'ai'
);
```

### 5. Widget Data Source
Store weekly summary in dedicated location for widget:
- Option A: `profiles.weekly_focus_summary` JSONB column
- Option B: Task with `task_type='weekly_focus'` (query by type)
- **Recommended:** Option B (no schema change, uses existing patterns)

---

## Open Questions Resolved

| Question | Answer (from context) |
|----------|----------------------|
| Suggestion expiry | Auto-expire after 7 days — mark as `dismissed` with reason 'expired' |
| Weekly focus format | Dashboard widget (not email), encouraging coach tone |
| Confidence display | Show reasoning when < 80%, hide for obvious suggestions |
| Suggestion cap | 10 per week maximum, prioritized by impact |
| AI model | Use opus for quality (weekly, not realtime) |

---

## Files to Create/Modify

### New Files
- `business-os/workflows/weekly-ai-focus.json` — n8n workflow
- `business-os/workflows/README-weekly-ai-focus.md` — Documentation
- `dashboard/src/components/widgets/weekly-focus-widget.tsx` — Dashboard widget
- `dashboard/src/lib/action-center/ai-analysis.ts` — Analysis utilities

### Modified Files
- `dashboard/src/app/dashboard/dashboard-content.tsx` — Add Weekly Focus widget
- `dashboard/src/components/action-center/task-row.tsx` — Add confidence indicator
- `dashboard/src/components/action-center/task-detail-content.tsx` — Add AI suggestion info

---

*Research completed: 2026-01-25*
