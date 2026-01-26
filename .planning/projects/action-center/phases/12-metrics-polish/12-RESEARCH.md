# Phase 12: Metrics & Polish - Research

**Completed:** 2026-01-26
**Status:** Ready for planning

## Executive Summary

Phase 12 infrastructure is largely in place. The database views for aggregation exist (`user_task_summary`, `department_task_summary`, `system_task_summary`), UI component patterns are established (MetricCard, MetricsGrid), and the health system has clear integration points. This phase is primarily UI + integration work.

---

## 1. Existing Database Views - READY TO USE

The Action Center already has comprehensive task aggregation views (from `20260122_action_center_views.sql`):

### `action_center.user_task_summary` - Personal Stats
```
Per-user metrics:
- open_count, in_progress_count, waiting_count, done_count, dismissed_count
- actionable_count (open + in_progress combined)
- overdue_count (past due date, not done/dismissed)
- due_today_count, due_this_week_count
- critical_count, high_priority_count (actionable only)
- completed_this_week, completed_last_7_days
- avg_completion_days_30d (rolling average)
```

### `action_center.department_task_summary` - Department Metrics
```
Per-department aggregations:
- Status counts (open, in_progress, waiting, done, dismissed)
- actionable_count, overdue_count, due_today_count
- critical_count, high_priority_count
- created_last_7_days, completed_last_7_days
- completion_rate_30d (%)
- avg_completion_days_30d
```

### `action_center.system_task_summary` - System Overview
```
System-wide metrics:
- All status counts
- actionable_count, overdue_count, due_today_count
- critical_count, high_priority_count
- created_last_7_days, completed_last_7_days
- completion_rate_7d (%)
```

### `action_center.tasks_extended` - Enhanced Task View
```
Computed fields:
- is_overdue (boolean)
- due_category (no_date|overdue|today|this_week|later)
- is_blocked (has incomplete dependencies)
- blocked_by_count, blocking_count (integers)
```

---

## 2. Dashboard UI Component Patterns

### MetricCard (`/dashboard-kit/components/dashboard/metric-card.tsx`)
```typescript
Props:
- label (string)
- value (string | number)
- description (optional)
- delta (trend value, e.g., +15%)
- deltaDirection ('up' | 'down' | undefined)
- status (HealthStatus: 'healthy' | 'warning' | 'critical')
- format ('currency' | 'percent' | 'number')
- icon (LucideIcon)
```

### MetricsGrid (`/dashboard-kit/components/dashboard/metrics-grid.tsx`)
```
- Layouts: 2, 3, or 4 columns (responsive)
- Handles loading states with skeletons
- Accepts onMetricClick callbacks
```

---

## 3. Health API Integration Pattern

The existing `/api/mobile/health.ts` shows the integration pattern:

**Current Pattern:**
- Fetches data from specialized query functions
- Calculates scores (0-100) for each department
- Maps to health status: `healthy` (85+), `warning` (60-84), `critical` (<60)
- Generates alerts based on thresholds

**Recommended Task Health Formula:**
- Completion rate (30d): 50% weight
- Overdue count as % of actionable: 30% weight (deduction)
- Critical/high priority resolution: 20% weight

---

## 4. User Preferences System

Mastery tracking uses `profiles.task_mastery` JSONB column.

**For Weekly Goal:**
- Add `profiles.task_preferences` JSONB column
- Format: `{weekly_goal_target: 15, ...}`
- Or use existing user settings pattern if available

---

## 5. Edge Case Implementation Patterns

### Deleted Entity Handling
- Task references `related_entity_id` (UUID) and `related_entity_type` (TEXT)
- No FK constraint (soft reference pattern)
- Show "Entity deleted" state in task detail view
- Allow completing/dismissing task anyway

### Chain Dismissal
- Already implemented in `dismiss-with-dependents-dialog.tsx`
- Option 1: Auto-unblock dependents
- Option 2: Create decision task for cascade handling

### Overdue Escalation
- Create daily task rule checking tasks overdue >3 days
- Escalate priority: normal→high or high→critical
- Log activity entry: "Escalated due to age"

### Task Reopening (7-day window)
- Add `completed_at` tracking (may already exist)
- UI: Show "Reopen" button if `done AND NOW() - completed_at <= 7 days`
- Reopen sets status back to `open`, clears `completed_at`

---

## 6. Files to Modify/Create

### New Files
| File | Purpose |
|------|---------|
| `/lib/api/task-metrics.ts` | Query functions (getPersonalStats, getDepartmentMetrics, getSystemOverview) |
| `/components/personal-stats-banner.tsx` | Stats display at top of task list |
| `/components/personal-stats-widget.tsx` | Dashboard widget showing personal stats |
| `/components/weekly-goal-modal.tsx` | Set weekly target UX |
| Supabase migration | Add `profiles.task_preferences` + helper functions |

### Modified Files
| File | Changes |
|------|---------|
| `action-center-content.tsx` | Add personal stats banner |
| `dashboard-content.tsx` | Add task metrics widget |
| `/lib/api/mobile-health.ts` | Integrate task health score |
| Task detail page | Add reopen button for recently completed |
| Complete/dismiss actions | Ensure completion tracking |

---

## 7. Requirements Mapping

| Requirement | Database Source | UI Component |
|-------------|-----------------|--------------|
| MET-01 Personal stats | `user_task_summary` + `task_preferences` | PersonalStatsBanner + PersonalStatsWidget |
| MET-02 System overview | `system_task_summary` | Dashboard metrics (admin only) |
| MET-03 Department metrics | `department_task_summary` | Department section (dept heads) |
| MET-04 Health integration | All views → score calculation | Existing health dashboard |

---

## 8. Key Decisions Made (from context discussion)

1. **Gamification**: Weekly goal (not daily streaks)
2. **Display locations**: Both dashboard widget AND task list banner
3. **Access control**: Regular users see personal, dept heads see department, admins see system
4. **Edge cases**: All at Claude's discretion (safest approaches)

---

## 9. Technical Recommendations

### Weekly Goal Storage
```typescript
// profiles.task_preferences JSONB
{
  weekly_goal_target: 15,  // tasks per week
  weekly_goal_enabled: true
}
```

### Personal Stats Banner Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 3 completed today  │  📊 12/15 weekly goal  │  ⚠ 2 overdue │
└─────────────────────────────────────────────────────────────┘
```

### Health Score Integration
```typescript
// Soft integration: Task health as one factor
const taskHealthScore = calculateTaskHealth(department);
const combinedScore = (workflowScore * 0.6) + (taskHealthScore * 0.4);
```

### Reopen Window Logic
```typescript
const canReopen = task.status === 'done' &&
  task.completed_at &&
  differenceInDays(new Date(), task.completed_at) <= 7;
```

---

## 10. Risk Areas

1. **Performance**: System summary view counts all tasks - may need caching for scale
2. **No user management UI**: Single-user for v1 means weekly goal is profile-level only
3. **Health balance**: Ensure task metrics don't overwhelm existing workflow signals
4. **Missing preferences column**: Need migration for `task_preferences` JSONB

---

*Research completed: 2026-01-26*
