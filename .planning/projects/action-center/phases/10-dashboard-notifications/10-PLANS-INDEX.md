# Phase 10: Dashboard & Notifications - Plans Index

> **CEO Summary:** This phase adds the Action Center widget to the main dashboard and implements daily email digests to keep Mike informed of tasks requiring attention.

## Wave Structure

### Wave 1 - Foundation (Parallel)
| Plan | Name | Autonomous |
|------|------|------------|
| 10-01 | Database Migration for Notification Preferences and Task Count RPC | Yes |
| 10-02 | Install Dependencies - Resend and Sonner | Yes |

### Wave 2 - Widget & Badge (After Wave 1)
| Plan | Name | Depends On | Autonomous |
|------|------|------------|------------|
| 10-03 | Action Center Dashboard Widget Component | 10-01 | Yes |
| 10-04 | Navigation Badge with Real-time Subscription | 10-01 | Yes |
| 10-05 | Widget Integration on Main Dashboard | 10-03 | Yes |

### Wave 3 - Settings UI (After Wave 1+2)
| Plan | Name | Depends On | Autonomous |
|------|------|------------|------------|
| 10-06 | Notification Preferences Form in Settings | 10-01, 10-02 | Yes |

### Wave 4 - Email Infrastructure (After Wave 1)
| Plan | Name | Depends On | Autonomous |
|------|------|------------|------------|
| 10-07 | Resend Email Service and Digest Template | 10-02 | Yes |
| 10-08 | Digest Generation Function and API Endpoint | 10-01, 10-07 | Yes |

### Wave 5 - Scheduled Digest (After Wave 4)
| Plan | Name | Depends On | Autonomous |
|------|------|------------|------------|
| 10-09 | n8n Workflow for Daily Digest Scheduling | 10-08 | No |

## Execution Order

```
Wave 1: [10-01, 10-02] (parallel)
    |
    v
Wave 2: [10-03, 10-04] (parallel after 10-01)
    |       |
    v       v
  10-05   10-06 (10-05 after 10-03, 10-06 after 10-01+10-02)
    |
    v
Wave 4: 10-07 (after 10-02)
    |
    v
  10-08 (after 10-01 + 10-07)
    |
    v
Wave 5: 10-09 (after 10-08, requires human)
```

## Key Deliverables

1. **Dashboard Widget** - Shows critical, due today, overdue task counts with click-to-filter
2. **Navigation Badge** - Real-time count of critical + overdue on Action Center link
3. **Notification Settings** - Daily digest toggle, time picker, critical alerts toggle
4. **Email Digest** - Friendly conversational email sent at user's preferred time
5. **n8n Workflow** - Scheduled sender that processes all users based on their timezone

## Files Modified/Created

```
supabase/migrations/20260125_notification_prefs_task_counts.sql
dashboard/package.json
dashboard/src/app/layout.tsx
dashboard/src/lib/email/resend.ts
dashboard/src/lib/email/templates/daily-digest.tsx
dashboard/src/lib/email/send-digest.ts
dashboard/src/lib/email/generate-digest-data.ts
dashboard/src/lib/api/task-queries.ts
dashboard/src/lib/supabase/types.ts
dashboard/src/lib/supabase/profiles.ts
dashboard/src/components/widgets/action-center-widget.tsx
dashboard/src/components/nav/action-center-badge.tsx
dashboard/src/hooks/use-task-badge-count.ts
dashboard/src/app/dashboard/dashboard-content.tsx
dashboard/src/app/dashboard/page.tsx
dashboard/src/app/settings/page.tsx
dashboard/src/app/api/digest/send/route.ts
business-os/workflows/README-daily-digest.md
```

## Requirements Mapping

| Requirement | Plan(s) |
|-------------|---------|
| DASH-01: Widget on main dashboard | 10-03, 10-05 |
| DASH-02: Critical tasks count with tap | 10-03 |
| DASH-03: Due Today tasks count | 10-03 |
| DASH-04: "View all X tasks" link | 10-03 |
| DASH-05: Task count badge in nav | 10-04 |
| NOTIF-01: Daily digest at 7am | 10-08, 10-09 |
| NOTIF-02: Digest shows critical/due/overdue/stats | 10-07 |
| NOTIF-03: Notification preferences | 10-01, 10-06 |
| NOTIF-04: Digest on/off toggle | 10-06 |
