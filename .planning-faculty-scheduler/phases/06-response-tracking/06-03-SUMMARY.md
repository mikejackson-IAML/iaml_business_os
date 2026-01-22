# 06-03 Summary: Dashboard UI - Show Viewed Status in Not Responded List

## What Was Built

Updated the Faculty Scheduler dashboard to display "Viewed" badges on instructors who have opened their notification email, providing visibility into engagement before response.

## Changes Made

### TypeScript Types (`faculty-scheduler-queries.ts`)

1. **NotRespondedInstructor interface** - Added `viewed_at: string | null` field to capture when instructor viewed the notification (null = not yet viewed)

2. **DashboardSummaryStats interface** - Added `total_viewed: number` field to track count of instructors who viewed notifications; also updated default error return value

### Not Responded List Component (`not-responded-list.tsx`)

1. **Imports** - Added `Eye` icon from lucide-react and Tooltip components from dashboard-kit

2. **formatViewedAt helper** - New function that formats timestamps for tooltip display (e.g., "Jan 22, 3:45 PM")

3. **Instructor row rendering** - Updated to show:
   - "Viewed" badge with Eye icon when `viewed_at` is not null
   - Badge uses outline variant with muted styling (neutral/gray as per context decision)
   - Tooltip shows formatted timestamp on hover

## Design Decisions

- **Subtle badge styling**: Outline variant with `text-muted-foreground border-muted-foreground/30` keeps the badge neutral and unobtrusive
- **No "Not Viewed" badge**: Only show badge when viewed; absence of badge indicates not viewed (Not Viewed is higher priority so appears first via view sort order)
- **Timestamp on hover only**: Keeps the UI clean while still providing detail when needed

## Verification Checklist

- [x] `NotRespondedInstructor` type includes `viewed_at: string | null`
- [x] `DashboardSummaryStats` type includes `total_viewed: number`
- [x] Tooltip imports added to not-responded-list.tsx
- [x] `formatViewedAt` helper function formats dates like "Jan 22, 3:45 PM"
- [x] "Viewed" badge appears only when `viewed_at` is not null
- [x] Badge uses outline variant with muted styling (neutral/gray)
- [x] Tooltip shows formatted timestamp on hover
- [x] Eye icon appears in badge
- [x] Not Viewed instructors appear first in list (via view sort order from 06-01)

## Commits

1. `feat(06-03): add viewed_at to NotRespondedInstructor interface`
2. `feat(06-03): add total_viewed to DashboardSummaryStats interface`
3. `feat(06-03): add Tooltip and Eye icon imports`
4. `feat(06-03): add formatViewedAt helper function`
5. `feat(06-03): show Viewed badge with tooltip on instructor rows`

## Files Modified

| File | Changes |
|------|---------|
| `dashboard/src/lib/api/faculty-scheduler-queries.ts` | Added `viewed_at` to NotRespondedInstructor, `total_viewed` to DashboardSummaryStats |
| `dashboard/src/app/dashboard/faculty-scheduler/components/not-responded-list.tsx` | Added imports, formatViewedAt helper, Viewed badge with tooltip |

## Requirements Satisfied

- **RT-03**: Dashboard shows "Viewed" vs "Not Viewed" status per instructor notification
