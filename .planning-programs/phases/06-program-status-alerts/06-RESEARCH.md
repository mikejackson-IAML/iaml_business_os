# Phase 6: Program Status & Alerts - Research

**Researched:** 2026-02-02
**Domain:** Status badge UI, alert calculation logic, logistics readiness display
**Confidence:** HIGH

## Summary

Phase 6 implements GO/CLOSE/NEEDS status badges and logistics alerts on top of an existing, well-structured codebase. The foundation is strong: `ProgramStatusBadge` and `LogisticsProgress` components already exist (from Phases 1-4), the Badge UI component has traffic-light color variants (`healthy`, `warning`, `critical`), and the logistics schema captures all 10 in-person / 6 virtual checklist items with timestamps.

The primary work involves:
1. Updating `ProgramStatusBadge` to show count in parentheses format "GO (8)"
2. Creating an alert calculation layer (either database view or TypeScript utility)
3. Enhancing `LogisticsProgress` to calculate and display actual warnings
4. Adding alert badges to the programs list and detail header

**Primary recommendation:** Calculate alerts in a new TypeScript utility file (`dashboard/src/lib/api/program-alerts.ts`) that can be used both server-side (API routes) and client-side. This keeps logic testable and avoids complex SQL views.

## Standard Stack

### Core (Already in Codebase)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `@radix-ui/react-tooltip` | latest | Tooltip on badge hover | EXISTS in dashboard-kit |
| `lucide-react` | latest | AlertTriangle, AlertCircle icons | EXISTS - used in LogisticsProgress |
| `class-variance-authority` | latest | Badge variant styling | EXISTS in badge.tsx |

### Components Available

| Component | Path | Current Use |
|-----------|------|-------------|
| `Badge` | `@/dashboard-kit/components/ui/badge` | Has `healthy`/`warning`/`critical` variants |
| `ProgramStatusBadge` | `programs/components/program-status-badge.tsx` | Basic GO/CLOSE/NEEDS logic |
| `LogisticsProgress` | `programs/components/logistics-progress.tsx` | X/Y format with optional warnings |
| `Tooltip` | `@/dashboard-kit/components/ui/tooltip` | Radix-based, ready to use |
| `AlertList` | `@/dashboard-kit/components/dashboard/alert-list.tsx` | Full alert rendering pattern |
| `StatusIndicator` | `@/dashboard-kit/components/dashboard/status-indicator.tsx` | Status dot patterns |

### No Additional Libraries Needed

All UI primitives exist. This phase is pure integration work.

## Architecture Patterns

### Recommended Project Structure

```
dashboard/src/
├── lib/api/
│   ├── programs-queries.ts          # EXISTS - main query functions
│   └── program-alerts.ts            # NEW - alert calculation utilities
├── app/dashboard/programs/
│   ├── programs-content.tsx         # UPDATE - add alert badges to list
│   ├── [id]/
│   │   └── program-detail-content.tsx  # UPDATE - add alerts to header
│   └── components/
│       ├── program-status-badge.tsx # UPDATE - format to "GO (8)"
│       ├── logistics-progress.tsx   # UPDATE - calculate real warnings
│       └── alerts/                  # NEW - alert display components
│           ├── alert-count-badge.tsx
│           └── alert-breakdown.tsx
```

### Pattern 1: Alert Calculation Utility

**What:** Centralized TypeScript function that calculates all alerts for a program
**When to use:** Both list view (summary) and detail view (full breakdown)

```typescript
// Source: New pattern based on existing programs-queries.ts structure

interface ProgramAlert {
  id: string;
  type: 'instructor' | 'hotel' | 'venue' | 'room_block' | 'beo' | 'materials' | 'av' | 'registration' | 'payment';
  severity: 'warning' | 'critical';
  message: string;
  daysUntilThreshold?: number;
}

interface AlertSummary {
  warningCount: number;
  criticalCount: number;
  alerts: ProgramAlert[];
}

function calculateProgramAlerts(
  program: ProgramDetail,
  logistics: ProgramLogistics,
  registrations: { payment_status: string; payment_due_date: string | null }[]
): AlertSummary {
  const alerts: ProgramAlert[] = [];
  const daysUntil = program.days_until_start ?? 999;
  const isVirtual = program.format === 'virtual';

  // No instructor (WARNING <=45, CRITICAL <=30)
  if (!logistics.instructor_confirmed_at) {
    if (daysUntil <= 30) {
      alerts.push({ id: 'instructor', type: 'instructor', severity: 'critical', message: 'No instructor confirmed' });
    } else if (daysUntil <= 45) {
      alerts.push({ id: 'instructor', type: 'instructor', severity: 'warning', message: 'Instructor not yet confirmed' });
    }
  }

  // Hotel/venue/room block (in-person only, WARNING <=90, CRITICAL <=60)
  if (!isVirtual) {
    // ... similar pattern for each logistics item
  }

  // BEO not received (WARNING <=10, CRITICAL <=7)
  // Materials not sent to instructor (WARNING <=45, CRITICAL <=30)
  // Materials not printed (WARNING <=14, CRITICAL <=7)
  // Materials not shipped (WARNING <=10, CRITICAL <=5)
  // AV not shipped (in-person only, WARNING <=10, CRITICAL <=5)

  // Below 6 registrations (WARNING <=45, CRITICAL <=30)
  if (program.current_enrolled < 6) {
    if (daysUntil <= 30) {
      alerts.push({ id: 'registrations', type: 'registration', severity: 'critical', message: `Only ${program.current_enrolled} registrations` });
    } else if (daysUntil <= 45) {
      alerts.push({ id: 'registrations', type: 'registration', severity: 'warning', message: `Only ${program.current_enrolled} registrations` });
    }
  }

  // Unpaid invoices (WARNING at due date, CRITICAL 14+ days past due)
  // Rolled up to program level per CONTEXT.md

  return {
    warningCount: alerts.filter(a => a.severity === 'warning').length,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    alerts,
  };
}
```

### Pattern 2: Logistics Readiness Calculation

**What:** Calculate completed items and total based on format
**When to use:** LogisticsProgress component enhancement

```typescript
// Source: Based on existing getLogisticsStats in programs-content.tsx

interface LogisticsReadiness {
  completed: number;
  total: number;
  warnings: number;
}

function calculateLogisticsReadiness(
  format: string | null,
  logistics: ProgramLogistics,
  alerts: AlertSummary
): LogisticsReadiness {
  const isVirtual = format === 'virtual';
  const total = isVirtual ? 6 : 10;

  // In-person (10 items):
  // 1. Instructor confirmed
  // 2. My hotel booked
  // 3. Instructor hotel booked
  // 4. Room block secured
  // 5. Venue confirmed
  // 6. BEO received (uploaded and final)
  // 7. Materials sent to instructor
  // 8. Materials printed
  // 9. Materials shipped
  // 10. AV shipped

  // Virtual (6 items):
  // 1. Instructor confirmed
  // 2. Platform ready
  // 3. Calendar invites sent
  // 4. Reminder emails sent
  // 5. Materials sent to instructor
  // 6. Materials shipped (digital delivery)

  let completed = 0;

  // Common items
  if (logistics.instructor_confirmed_at) completed++;
  if (logistics.materials_sent_to_instructor) completed++;

  if (isVirtual) {
    if (logistics.platform_ready) completed++;
    if (logistics.calendar_invites_sent) completed++;
    if (logistics.reminder_emails_sent) completed++;
    if (logistics.materials_shipped) completed++; // Digital delivery counts
  } else {
    if (logistics.my_hotel_booked_at) completed++;
    if (logistics.instructor_hotel_booked_at) completed++;
    if (logistics.room_block_secured_at) completed++;
    if (logistics.venue_confirmed_at) completed++;
    if (logistics.beo_status === 'final') completed++;
    if (logistics.materials_printed) completed++;
    if (logistics.materials_shipped) completed++;
    if (logistics.av_shipped) completed++;
  }

  // Warnings = logistics-related alerts
  const logisticsAlertTypes = ['instructor', 'hotel', 'venue', 'room_block', 'beo', 'materials', 'av'];
  const warnings = alerts.alerts.filter(a => logisticsAlertTypes.includes(a.type)).length;

  return { completed, total, warnings };
}
```

### Pattern 3: Status Badge Display Enhancement

**What:** Update badge to show "GO (8)" format
**When to use:** Both list and detail views

```typescript
// Source: Enhancement to existing program-status-badge.tsx

export function ProgramStatusBadge({ enrolledCount, showCount = true, className }: ProgramStatusBadgeProps) {
  let variant: 'healthy' | 'warning' | 'critical';
  let label: string;

  if (enrolledCount >= 6) {
    variant = 'healthy';
    label = 'GO';
  } else if (enrolledCount >= 4) {
    variant = 'warning';
    label = 'CLOSE';
  } else {
    variant = 'critical';
    label = 'NEEDS';
  }

  return (
    <Badge variant={variant} className={className}>
      {label}{showCount && ` (${enrolledCount})`}
    </Badge>
  );
}
```

### Anti-Patterns to Avoid

- **Complex SQL views for alerts:** Calculation logic should be in TypeScript for testability and maintainability
- **Alert calculation on every render:** Calculate once and pass down, or use React Query caching
- **Inline threshold values:** Use constants for the 9 alert threshold pairs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Badge styling | Custom CSS classes | `Badge` with variant prop | Consistent theming, dark mode support |
| Tooltip behavior | Custom hover state | Radix Tooltip | Accessibility, positioning, animations |
| Icon colors | Inline style props | Tailwind classes matching Badge variants | Consistent with design system |
| Alert severity icons | Custom SVG | lucide-react AlertTriangle/AlertCircle | Already used in LogisticsProgress |

## Common Pitfalls

### Pitfall 1: Alert Threshold Edge Cases

**What goes wrong:** Off-by-one errors with "<=45 days" vs "<45 days"
**Why it happens:** Requirements say "<=45 days" but code might use "<"
**How to avoid:** Use explicit comparison operators matching requirements
**Warning signs:** Alerts appearing a day early or late

```typescript
// CORRECT: Match requirements exactly
if (daysUntil <= 45) // WARNING threshold
if (daysUntil <= 30) // CRITICAL threshold

// WRONG: Off by one
if (daysUntil < 45)
```

### Pitfall 2: On-Demand Programs

**What goes wrong:** Showing status badges or alerts for on-demand programs
**Why it happens:** Forgetting to check format before calculating
**How to avoid:** Early return for on-demand format
**Warning signs:** On-demand programs showing "NEEDS (0)"

```typescript
// Check at start of component/function
if (program.format === 'on-demand') return null;
```

### Pitfall 3: Archived/Completed Programs

**What goes wrong:** Showing badges for completed programs
**Why it happens:** Not checking days_until_start < 0
**How to avoid:** Filter or early return for completed programs
**Warning signs:** Past programs showing outdated alerts

```typescript
// Skip badges for completed programs
if (program.days_until_start !== null && program.days_until_start < 0) {
  return null;
}
```

### Pitfall 4: Virtual Program Logistics Count

**What goes wrong:** Showing X/10 for virtual programs instead of X/6
**Why it happens:** Not dynamically adjusting denominator
**How to avoid:** Total is conditional on format
**Warning signs:** Virtual programs showing inflated incomplete count

### Pitfall 5: Payment Alert Rollup

**What goes wrong:** One alert per unpaid invoice instead of rolled up
**Why it happens:** Not aggregating payment alerts per CONTEXT.md decision
**How to avoid:** Count unpaid, generate single alert like "3 unpaid invoices"
**Warning signs:** Alert list cluttered with individual payment alerts

## Code Examples

### Alert Count Badge for Programs List

```typescript
// Source: Pattern based on existing AlertList severityConfig

interface AlertCountBadgeProps {
  warningCount: number;
  criticalCount: number;
}

export function AlertCountBadge({ warningCount, criticalCount }: AlertCountBadgeProps) {
  if (warningCount === 0 && criticalCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {criticalCount > 0 && (
        <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{criticalCount}</span>
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{warningCount}</span>
        </span>
      )}
    </div>
  );
}
```

### Alert Thresholds Constants

```typescript
// Source: New constants file for alert thresholds from requirements

export const ALERT_THRESHOLDS = {
  instructor: { warning: 45, critical: 30 },
  hotel: { warning: 90, critical: 60 },
  venue: { warning: 90, critical: 60 },
  room_block: { warning: 90, critical: 60 },
  beo: { warning: 10, critical: 7 },
  materials_to_instructor: { warning: 45, critical: 30 },
  materials_printed: { warning: 14, critical: 7 },
  materials_shipped: { warning: 10, critical: 5 },
  av_shipped: { warning: 10, critical: 5 },
  registrations: { warning: 45, critical: 30 },
  payment: { warning: 0, critical: -14 }, // 0 = at due date, -14 = 14 days past
} as const;

export type AlertType = keyof typeof ALERT_THRESHOLDS;
```

### Tooltip on Badge Hover

```typescript
// Source: Using existing Tooltip components

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/dashboard-kit/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div> {/* Badge wrapper */}
        <ProgramStatusBadge enrolledCount={program.current_enrolled} />
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>6+ = GO, 4-5 = CLOSE, 0-3 = NEEDS</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Status as string | Status as variant + count | Phase 1 | Badge component already uses variants |
| Warnings hardcoded to 0 | Calculate from logistics data | Phase 6 | LogisticsProgress will show real warnings |

**Already implemented patterns to follow:**
- `ProgramStatusBadge` already calculates GO/CLOSE/NEEDS from `enrolledCount`
- `LogisticsProgress` already accepts `warnings` prop
- `AlertList` component shows the pattern for alert severity display

## Open Questions

1. **Logistics data loading on list page**
   - What we know: List view needs alert counts, but logistics is loaded per-program on detail page
   - What's unclear: Should we add a batch query to get alerts for all programs?
   - Recommendation: Add `getProgramsWithAlerts()` query that joins logistics data for list view, or calculate client-side after load

2. **Alert dismissal/snooze (Claude's Discretion)**
   - What we know: CONTEXT.md lists this as optional
   - What's unclear: Should v1 include any dismissal?
   - Recommendation: Skip for v1 - adds database complexity (dismissed_alerts table)

3. **New programs with no logistics data**
   - What we know: `getProgramLogistics()` returns defaults if no record
   - What's unclear: Show "0/N" or "Not started"?
   - Recommendation: Show "0/N" - consistent with format, user can see there's work to do

## Sources

### Primary (HIGH confidence)
- `dashboard/src/app/dashboard/programs/components/program-status-badge.tsx` - Existing badge implementation
- `dashboard/src/app/dashboard/programs/components/logistics-progress.tsx` - Existing progress component
- `dashboard/src/dashboard-kit/components/ui/badge.tsx` - Badge variants and styling
- `dashboard/src/lib/api/programs-queries.ts` - Query patterns, TypeScript interfaces
- `supabase/migrations/20260201_logistics_tab_schema.sql` - Logistics column definitions
- `supabase/migrations/20260214000000_program_dashboard_virtual_block_data.sql` - Dashboard view structure

### Secondary (HIGH confidence - codebase inspection)
- `dashboard/src/app/dashboard/programs/programs-content.tsx` - Where badges are used in list
- `dashboard/src/app/dashboard/programs/[id]/program-detail-content.tsx` - Where badges are used in detail
- `dashboard/src/dashboard-kit/components/dashboard/alert-list.tsx` - Alert display patterns
- `dashboard/src/dashboard-kit/components/ui/tooltip.tsx` - Tooltip implementation

### Tertiary (Context documents)
- `.planning-programs/phases/06-program-status-alerts/06-CONTEXT.md` - User decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already exist in codebase
- Architecture: HIGH - Clear patterns from existing implementation
- Pitfalls: HIGH - Based on requirements and existing code analysis
- Alert logic: HIGH - Requirements provide exact thresholds

**Research date:** 2026-02-02
**Valid until:** 30 days (stable codebase, no external dependencies)
