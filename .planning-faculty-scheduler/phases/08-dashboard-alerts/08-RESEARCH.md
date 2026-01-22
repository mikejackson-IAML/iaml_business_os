# Phase 8: Dashboard Alerts - Research

**Researched:** 2026-01-22
**Status:** Ready for planning

---

## 1. Schema Analysis

### Existing Tier Timing Fields (scheduled_programs table)

From `supabase/migrations/20260120_create_faculty_scheduler_schema.sql`:

```sql
-- Tier timing
released_at TIMESTAMPTZ,           -- When released to Tier 0
tier_0_ends_at TIMESTAMPTZ,        -- When Tier 0 window closes
tier_1_ends_at TIMESTAMPTZ,        -- When Tier 1 window closes
```

**Key insight:** `tier_0_ends_at` and `tier_1_ends_at` are the exact timestamps we need for "Tier Ending" alerts. The `status` column tracks current tier (`tier_0`, `tier_1`, `tier_2`).

### Existing Response Tracking (Phase 6)

From `supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql`:

```sql
-- On notifications table
viewed_at TIMESTAMPTZ  -- NULL = not yet viewed, timestamp = first magic link click
```

**Key insight:** `viewed_at IS NULL` combined with `created_at` gives us "VIP instructor notified N days ago but hasn't viewed."

### Instructor Tier Information

From the faculty table extension:
```sql
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS tier_designation INTEGER;
-- 0 = VIP (Tier 0 access), NULL = normal instructor
```

**VIP identification query pattern:**
```sql
WHERE f.tier_designation = 0  -- VIP instructors only
```

### What We Need to Add

**New table: `faculty_scheduler.alerts`**
```sql
CREATE TABLE faculty_scheduler.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert identity
  alert_type TEXT NOT NULL CHECK (alert_type IN ('tier_ending', 'vip_non_response')),
  scheduled_program_id UUID REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES faculty(id) ON DELETE CASCADE,  -- For VIP alerts
  notification_id UUID REFERENCES faculty_scheduler.notifications(id),  -- For VIP alerts

  -- Alert state
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),

  -- Content (denormalized for display)
  title TEXT NOT NULL,
  description TEXT,

  -- Tracking
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  dismissed_by TEXT,
  resolved_at TIMESTAMPTZ,

  -- Prevent duplicate alerts
  UNIQUE(alert_type, scheduled_program_id, instructor_id)
);
```

**Configuration table for thresholds:**
```sql
-- Could use existing n8n_brain.preferences or create faculty_scheduler.config
-- Recommended: use n8n_brain.preferences with category = 'faculty_scheduler'

-- Example entries:
-- category: 'faculty_scheduler', key: 'tier_ending_alert_hours', value: 24
-- category: 'faculty_scheduler', key: 'vip_non_response_days', value: 3
```

---

## 2. UI Patterns

### Existing Alert Component (dashboard-kit)

From `dashboard/src/dashboard-kit/components/dashboard/alert-list.tsx`:

```tsx
// AlertItem type
export interface AlertItem {
  id: string;
  title: string;
  description?: string;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  timestamp?: Date;
  actionLabel?: string;
  actionCommand?: string;
  actionLink?: string;
  dismissable?: boolean;
}

// Severity styling
const severityConfig = {
  critical: {
    containerClass: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
    iconClass: 'text-red-500',
    badgeVariant: 'critical' as const,
  },
  warning: {
    containerClass: 'border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
    iconClass: 'text-amber-500',
    badgeVariant: 'warning' as const,
  },
  // ...
};
```

**Reusable:** `AlertList` component with `onDismiss` callback and dismiss button (X icon).

### Badge Component

From `dashboard/src/dashboard-kit/components/ui/badge.tsx`:

```tsx
// Variants available:
variant: {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  // ...
}
```

### Current Dashboard Header

From `dashboard/src/app/dashboard/faculty-scheduler/content.tsx`:

```tsx
<header className="mb-8">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-3">
      <Link href="/dashboard" ...>
        <ArrowLeft ... />
      </Link>
      <span className="badge-live">LIVE</span>
      <h1 className="text-display-sm text-foreground">Faculty Scheduler</h1>
    </div>
    <UserMenu />
  </div>
</header>
```

**Alert badge placement:** Add to header row, between title and UserMenu:
```tsx
<div className="flex items-center gap-3">
  {/* ...existing... */}
  <h1>Faculty Scheduler</h1>
  {alertCount > 0 && (
    <Badge variant={hasUrgent ? 'critical' : 'warning'} onClick={scrollToAlerts}>
      {alertCount}
    </Badge>
  )}
</div>
```

### Server Actions Pattern

From `dashboard/src/app/dashboard/faculty-scheduler/actions.ts`:

```tsx
'use server';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function someAction(): Promise<ActionResult> {
  const supabase = getServerClient();
  // ... RPC call or query
  revalidatePath('/dashboard/faculty-scheduler');
  return { success: true };
}
```

**New action needed:** `dismissAlert(alertId: string)`

---

## 3. Alert Logic

### Alert Type 1: Tier Ending (Critical)

**Condition:**
- Program status is `tier_0` or `tier_1`
- Program has open blocks (`open_blocks > 0`)
- Current tier ends within configurable threshold (default: 24 hours)

**SQL pattern:**
```sql
SELECT sp.*
FROM faculty_scheduler.scheduled_programs sp
WHERE sp.status IN ('tier_0', 'tier_1')
  AND EXISTS (
    SELECT 1 FROM faculty_scheduler.program_blocks pb
    WHERE pb.scheduled_program_id = sp.id AND pb.status = 'open'
  )
  AND (
    (sp.status = 'tier_0' AND sp.tier_0_ends_at <= NOW() + INTERVAL '24 hours')
    OR (sp.status = 'tier_1' AND sp.tier_1_ends_at <= NOW() + INTERVAL '24 hours')
  );
```

**Title format:** "Program Name - Tier 0 ends in 4 hours"
**Description:** "2 open blocks, 5 instructors notified, 0 responses"

**Auto-resolve:** When all blocks claimed OR tier advances

### Alert Type 2: VIP Non-Response (Warning)

**Condition:**
- Notification sent to VIP instructor (tier_designation = 0)
- Notification type = 'tier_release'
- email_status = 'sent'
- viewed_at IS NULL
- created_at <= NOW() - INTERVAL 'N days'

**SQL pattern:**
```sql
SELECT n.*, f.full_name, sp.name as program_name
FROM faculty_scheduler.notifications n
JOIN faculty f ON f.id = n.instructor_id
JOIN faculty_scheduler.scheduled_programs sp ON sp.id = n.scheduled_program_id
WHERE n.notification_type = 'tier_release'
  AND n.email_status = 'sent'
  AND n.viewed_at IS NULL
  AND f.tier_designation = 0  -- VIP only
  AND n.created_at <= NOW() - INTERVAL '3 days'
  AND sp.status IN ('tier_0', 'tier_1', 'tier_2')  -- Still recruiting
  -- No claim exists
  AND NOT EXISTS (
    SELECT 1 FROM faculty_scheduler.claims c
    JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
    WHERE c.instructor_id = n.instructor_id
      AND pb.scheduled_program_id = n.scheduled_program_id
      AND c.status = 'confirmed'
  );
```

**Title format:** "John Smith hasn't viewed Program Name"
**Description:** "VIP instructor notified 5 days ago"

**Auto-resolve:** When instructor views (viewed_at set) OR claims a block

### Implementation Options

**Option A: Computed on-the-fly (View-based)**
- Create a SQL view that computes active alerts
- Pros: Always up-to-date, no sync issues, simpler
- Cons: Can't track dismissed state, no history

**Option B: Stored alerts with cron refresh (Recommended)**
- Store alerts in table, refresh via n8n workflow or trigger
- Pros: Can dismiss, track history, audit trail
- Cons: Needs sync mechanism

**Recommendation:** Option B with a hybrid approach:
1. SQL function `faculty_scheduler.generate_alerts()` computes current alert conditions
2. Compare against stored alerts table
3. Insert new alerts, auto-resolve when condition cleared
4. Dismissed alerts stay dismissed for same event (unique constraint)

---

## 4. Implementation Notes

### Alert Generation Strategy

**Trigger points for refresh:**
1. On page load (via query)
2. After any claim action (revalidatePath)
3. After tier advancement (n8n workflow calls refresh)
4. Periodically via n8n (every 15 minutes)

**Function signature:**
```sql
CREATE OR REPLACE FUNCTION faculty_scheduler.refresh_alerts()
RETURNS TABLE (
  created_count INTEGER,
  resolved_count INTEGER,
  active_count INTEGER
);
```

### Dashboard Data Integration

Extend `getFacultySchedulerDashboardData()`:
```tsx
export interface FacultySchedulerDashboardData {
  programs: RecruitmentPipelineProgram[];
  notResponded: NotRespondedInstructor[];
  summaryStats: DashboardSummaryStats;
  alerts: FacultySchedulerAlert[];  // NEW
}
```

### Dismiss with Undo Pattern

```tsx
// State
const [pendingDismiss, setPendingDismiss] = useState<string | null>(null);

// On dismiss click
setPendingDismiss(alertId);
const timeout = setTimeout(() => {
  dismissAlert(alertId);  // Server action
  setPendingDismiss(null);
}, 10000);

// Undo handler
clearTimeout(timeout);
setPendingDismiss(null);
```

### Configuration Storage

Use existing n8n_brain.preferences:
```sql
-- Set thresholds
SELECT n8n_brain.set_preference(
  'faculty_scheduler',
  'tier_ending_alert_hours',
  '24'::JSONB
);

-- Read thresholds in alert generation
SELECT value::INTEGER
FROM n8n_brain.preferences
WHERE category = 'faculty_scheduler'
  AND key = 'tier_ending_alert_hours';
```

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/migrations/20260122_faculty_scheduler_phase8_alerts.sql` | New alerts table, refresh function |
| `dashboard/src/lib/api/faculty-scheduler-queries.ts` | Add `getAlerts()`, extend dashboard data |
| `dashboard/src/app/dashboard/faculty-scheduler/actions.ts` | Add `dismissAlert()` action |
| `dashboard/src/app/dashboard/faculty-scheduler/components/alert-section.tsx` | New component |
| `dashboard/src/app/dashboard/faculty-scheduler/content.tsx` | Add alert badge in header, alert section in layout |

---

## 5. Open Questions

None - all decisions captured in 08-CONTEXT.md:
- Badge-only approach in header (not sidebar nav)
- Individual dismiss with undo toast
- Severity: critical for tier-ending, warning for VIP non-response
- One alert per program maximum (highest priority wins)
- Auto-resolve when condition fixed

---

## Summary for Planner

**Schema work (1 plan):**
- Create alerts table with unique constraint
- Create refresh_alerts() function
- Create view for active alerts with count
- Add configuration entries to n8n_brain.preferences

**UI work (1-2 plans):**
- Alert badge in dashboard header (click scrolls to section)
- AlertSection component using dashboard-kit AlertList
- Dismiss server action with optimistic UI + undo toast
- Extend dashboard data loader

**Integration work:**
- n8n workflow or cron to periodically refresh alerts
- OR: Trigger-based refresh on claim/tier changes (more complex)

**Recommended plan split:**
1. Plan 08-01: Schema + alert generation logic
2. Plan 08-02: Dashboard UI (badge, section, dismiss)
3. Plan 08-03: n8n integration for periodic refresh (optional if triggers sufficient)
