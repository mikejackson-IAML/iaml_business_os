# Phase 6 Verification: Response Tracking

**Verification Date:** 2026-01-22
**Status:** passed

---

## Phase Goal

Track when instructors click their magic links so dashboard shows viewed vs not-viewed status.

---

## must_haves Checklist

| ID | Requirement | Status |
|----|-------------|--------|
| RT-01 | System records when instructor clicks magic link (portal entry) | ✓ |
| RT-02 | Notification record has viewed_at column that gets updated on first magic link click | ✓ |
| RT-03 | Dashboard shows "Viewed" vs "Not Viewed" status per instructor notification | ✓ |

---

## Success Criteria Verification

### 1. When instructor clicks magic link, viewed_at timestamp is recorded in notification record

**Status:** ✓ PASSED

**Evidence:**

The `validate_magic_token()` function in the migration has been updated to call `record_notification_view()`:

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 171-213)
CREATE OR REPLACE FUNCTION faculty_scheduler.validate_magic_token(
  p_token TEXT
) ...
BEGIN
  -- Get instructor_id from token first (before any validation)
  SELECT mt.instructor_id INTO v_instructor_id
  FROM faculty_scheduler.magic_tokens mt
  WHERE mt.token = p_token;

  -- Record notification view if we found an instructor
  -- This happens even if token is expired or instructor inactive
  IF v_instructor_id IS NOT NULL THEN
    PERFORM faculty_scheduler.record_notification_view(v_instructor_id);
  END IF;
  ...
END;
```

The `record_notification_view()` helper function only updates on first click:

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 31-61)
CREATE OR REPLACE FUNCTION faculty_scheduler.record_notification_view(
  p_instructor_id UUID,
  p_scheduled_program_id UUID DEFAULT NULL
)
...
  UPDATE faculty_scheduler.notifications
  SET viewed_at = NOW()
  WHERE id = (
    SELECT id
    FROM faculty_scheduler.notifications
    WHERE instructor_id = p_instructor_id
      ...
      AND viewed_at IS NULL  -- Only updates first view
    ORDER BY created_at DESC
    LIMIT 1
  )
```

---

### 2. Dashboard shows "Viewed" badge on instructors who have opened their notification

**Status:** ✓ PASSED

**Evidence:**

The `NotRespondedList` component displays a "Viewed" badge with Eye icon when `viewed_at` is present:

```tsx
// From: dashboard/src/app/dashboard/faculty-scheduler/components/not-responded-list.tsx (lines 106-123)
{instructor.viewed_at && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs text-muted-foreground border-muted-foreground/30"
        >
          <Eye className="h-3 w-3 mr-1" />
          Viewed
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Viewed {formatViewedAt(instructor.viewed_at)}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

The badge styling is neutral/gray per the context decision (uses `text-muted-foreground` and `border-muted-foreground/30`).

---

### 3. "Not Responded" list distinguishes between "Viewed, No Claim" and "Not Viewed"

**Status:** ✓ PASSED

**Evidence:**

The TypeScript types correctly include `viewed_at`:

```typescript
// From: dashboard/src/lib/api/faculty-scheduler-queries.ts (lines 42-55)
export interface NotRespondedInstructor {
  ...
  viewed_at: string | null;  // null = not yet viewed
}
```

The database view sorts Not Viewed first:

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 97-100)
ORDER BY
  -- Not Viewed first (NULL viewed_at), then by notified_at DESC
  n.viewed_at IS NOT NULL,
  n.created_at DESC;
```

The view includes `viewed_at` column for distinction:

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 67-80)
CREATE OR REPLACE VIEW faculty_scheduler.not_responded_instructors AS
SELECT
  ...
  n.viewed_at
FROM faculty_scheduler.notifications n
```

---

## Additional Implementation Details

### Dashboard Summary Stats Updated

The `dashboard_summary_stats` view now includes `total_viewed`:

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 130-133)
notification_stats AS (
  SELECT
    COUNT(DISTINCT instructor_id) as total_notified,
    COUNT(DISTINCT instructor_id) FILTER (WHERE viewed_at IS NOT NULL) as total_viewed
  FROM faculty_scheduler.notifications
  ...
)
```

TypeScript types updated:

```typescript
// From: dashboard/src/lib/api/faculty-scheduler-queries.ts (lines 70)
total_viewed: number;  // count of instructors who viewed notification
```

### Index Added for Performance

```sql
-- From: supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql (lines 21-22)
CREATE INDEX IF NOT EXISTS idx_notifications_viewed_at
ON faculty_scheduler.notifications(viewed_at);
```

### Edge Cases Handled

- **First click only:** `record_notification_view()` checks `viewed_at IS NULL`
- **Expired tokens:** View recorded before active check in `validate_magic_token()`
- **No program ID:** `record_notification_view()` accepts NULL `p_scheduled_program_id` and finds most recent notification

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql` | New migration with viewed_at column, helper function, updated views and RPC |
| `dashboard/src/lib/api/faculty-scheduler-queries.ts` | Added `viewed_at` to types, `total_viewed` to stats |
| `dashboard/src/app/dashboard/faculty-scheduler/components/not-responded-list.tsx` | Added Viewed badge with tooltip |

---

## Verification Summary

All three requirements (RT-01, RT-02, RT-03) have been implemented correctly:

1. **RT-01:** `validate_magic_token()` calls `record_notification_view()` when instructor clicks magic link
2. **RT-02:** `viewed_at` column exists on notifications table, updated by `record_notification_view()` on first click only
3. **RT-03:** Dashboard shows "Viewed" badge (with Eye icon and timestamp tooltip) and sorts Not Viewed instructors first

**Phase 6 Status: COMPLETE**
