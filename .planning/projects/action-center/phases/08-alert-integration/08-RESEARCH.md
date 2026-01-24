# Phase 8: Alert Integration - Research

**Researched:** 2026-01-24
**Status:** Ready for planning

## Research Questions

1. What does the current alert system look like? What tables/schema exist?
2. How does the Task API from Phase 2 work? What endpoint creates tasks?
3. Are there existing n8n workflows that create tasks or process webhooks?
4. How would we integrate Claude in an n8n workflow for title/description transformation?
5. How should we query for existing tasks to detect duplicates?

---

## Findings

### 1. Alert System Architecture

**Existing Alert Model (Faculty Scheduler):**
- Schema: `faculty_scheduler.alerts` table
- Fields: `alert_type`, `severity` (warning/critical), `status` (active/dismissed/resolved)
- Timestamps: `triggered_at`, `dismissed_at`, `resolved_at`
- Functions: `refresh_alerts()` creates/auto-resolves; `dismiss_alert()` handles dismissal

**For Action Center:**
- Alerts come from multiple Business OS components (SSL monitors, domain health, uptime, payments)
- Need standardized alert structure: `alert_type`, `severity`, `title`, `description`, `affected_resource`, `metadata`

### 2. Task API Endpoint & Request Format

**POST /api/tasks - Create Task**

Location: `/dashboard/src/app/api/tasks/route.ts`

**Request Body:**
```typescript
{
  title: string,                    // required
  description?: string,
  task_type?: 'standard' | 'approval' | 'decision' | 'review',
  priority: 'critical' | 'high' | 'normal' | 'low',
  due_date?: string,                // ISO: YYYY-MM-DD
  due_time?: string,                // HH:MM
  department?: string,
  assignee_id?: string,
  workflow_id?: string,
  depends_on?: string[],
  dedupe_key?: string,              // for duplicate prevention
  source?: 'manual' | 'alert' | 'workflow' | 'ai' | 'rule',
  related_entity_type?: string,
  related_entity_id?: string,
  related_entity_url?: string
}
```

**Authentication:** `X-API-Key` header required

### 3. n8n Workflow Patterns

**Standard Webhook Pattern:**
1. Webhook trigger → receives payload
2. Transform node → normalize incoming data
3. Query node → fetch context/check duplicates
4. Conditional routing → handle different severities
5. HTTP request → call Task API POST /api/tasks
6. Update source → mark alert as processed
7. Error handler → Slack notification or fallback

**Database Queries:**
- Use `n8n-nodes-base.postgres` with `executeQuery` operation
- Can call Supabase functions directly

### 4. AI Integration for Title Transformation

**Existing Pattern (Gemini in HeyReach workflow):**
- Uses `n8n-nodes-base.httpRequest` to call AI API
- Sends prompt + incoming data
- Receives classified/transformed output

**For Alert Titles:**
- Use HTTP request node to call Claude API
- Prompt pattern: "Transform this alert title to action-oriented format"
- Example: "SSL Certificate Expiring Soon" → "Renew SSL Certificate"

### 5. Duplicate Detection Strategy

**Dedupe Key Composition:**
- Composite: `{alert_type}:{affected_resource}` (e.g., "ssl_expiry:example.com")
- Store in task's `dedupe_key` field

**Query Pattern:**
```sql
-- Check for existing open task
SELECT id, priority, status
FROM action_center.tasks
WHERE dedupe_key = $1
  AND status IN ('open', 'in_progress')
LIMIT 1;

-- Priority escalation if found
UPDATE action_center.tasks
SET priority = 'critical'
WHERE id = $1;
```

**Dismissed Task Handling:**
- Respect 7-day dismissal window
- After 7 days: allow new task creation
- Check: `dismissed_at IS NULL OR dismissed_at < NOW() - INTERVAL '7 days'`

---

## Implementation Details

### Priority Mapping
| Alert Severity | Task Priority |
|----------------|---------------|
| Critical | critical |
| Warning | high |
| Info (configured) | low |

### Due Date Calculation
- **Critical:** After 6pm → due tomorrow 9am; otherwise → due today
- **Warning:** From alert metadata or end-of-week default
- **Info:** No due date (or per-type config)

### Source Linking
- `related_entity_type` = alert source (e.g., 'ssl_monitor', 'domain_health')
- `related_entity_id` = alert UUID
- `related_entity_url` = `/alerts/[id]`

### Alert Resolution
- When task completed → update alert `status = 'resolved'`, `resolved_at = NOW()`

### Configuration Storage
- Department mappings in n8n workflow config (not hardcoded)
- Per-alert-type settings in `n8n_brain.preferences` table

---

## Key Files to Reference

| Purpose | File |
|---------|------|
| Task API | `/dashboard/src/app/api/tasks/route.ts` |
| Task types | `/dashboard/src/lib/api/task-types.ts` |
| Task mutations | `/dashboard/src/lib/api/task-mutations.ts` |
| Action Center schema | `/supabase/migrations/20260122_action_center_schema.sql` |
| Alert example | `/supabase/migrations/20260122_faculty_scheduler_phase8_alerts.sql` |
| Phase context | `.planning/projects/action-center/phases/08-alert-integration/08-CONTEXT.md` |

---

## Recommendations

1. **Design standardized alert webhook payload** - All Business OS alerts should follow consistent structure
2. **Build AI transformation as reusable function** - Claude call for title/description generation
3. **Implement duplicate check before create** - Query first, escalate if needed
4. **Business hours utility** - Configurable (9am-6pm) for due date calculation
5. **Accumulation tracking** - Need to track alert occurrences for 3x/24h rule
6. **Department mapping config** - Maintainable via n8n workflow variables

---

*Research completed: 2026-01-24*
