# Phase 5: Attendance/Evaluations Tab - Research

**Researched:** 2026-02-01
**Domain:** Attendance tracking, evaluation surveys, aggregate scoring
**Confidence:** HIGH

## Summary

Research confirms Phase 5 can heavily reuse existing codebase patterns from Phases 2-4. The Registrations roster (`RegistrationsRoster` component) already displays per-block columns with checkmarks and handles cancelled registrations with greyed-out styling. The Logistics tab demonstrates the immediate-save checkbox pattern via PATCH API routes. Evaluation storage requires new database tables for survey templates and responses.

The core technical work involves:
1. Extending the existing roster table with attendance checkboxes (per-block)
2. Creating new Supabase tables for evaluation templates and responses
3. Building aggregate score calculation logic
4. Creating expandable cards for individual evaluation responses (reusing `LogisticsCard` pattern)

**Primary recommendation:** Extend `RegistrationsRoster` component to add attendance columns after the existing block columns. Reuse the `InlineCheckbox` pattern from logistics-card.tsx for immediate-save checkboxes. Create `evaluation_templates` and `evaluation_responses` tables in Supabase with JSONB for flexible question storage.

## Standard Stack

The established patterns for this phase:

### Core (Already in Codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16 | Framework | Project standard |
| React | 19 | UI Components | Project standard |
| Tailwind CSS | 3.x | Styling | Project standard |
| Supabase | - | Database + API | Project standard |
| Sonner | - | Toast notifications | Project standard for save confirmations |
| Lucide React | - | Icons | Project standard |

### Component Patterns (Reuse Existing)
| Component | Location | Purpose | Reuse |
|-----------|----------|---------|-------|
| `RegistrationsRoster` | `components/registrations-roster.tsx` | Roster table with blocks | Extend with attendance columns |
| `LogisticsCard` | `components/logistics/logistics-card.tsx` | Expandable card pattern | Use for individual evaluations |
| `InlineCheckbox` | `components/logistics/logistics-card.tsx` | Immediate-save checkbox | Use for attendance checkmarks |
| `Badge` | `dashboard-kit/components/ui/badge.tsx` | Status indicators | Use for score color coding |

### No New Dependencies Required

This phase requires NO new npm packages. All functionality can be built using existing patterns.

## Architecture Patterns

### Recommended Project Structure

```
dashboard/src/app/dashboard/programs/
├── [id]/
│   └── page.tsx                           # Already exists, loads attendance tab
├── components/
│   ├── registrations-roster.tsx           # EXTEND: Add attendance columns
│   ├── attendance/                        # NEW: Attendance-specific components
│   │   ├── attendance-roster.tsx          # Roster wrapper with attendance logic
│   │   ├── attendance-checkbox.tsx        # Per-block attendance checkbox
│   │   └── bulk-attendance-button.tsx     # "Mark all attended" button
│   └── evaluations/                       # NEW: Evaluation components
│       ├── evaluations-section.tsx        # Container for aggregate + individual
│       ├── aggregate-scores.tsx           # Average ratings display
│       ├── individual-response-card.tsx   # Expandable per-attendee card
│       └── overall-thoughts-excerpt.tsx   # Free-text excerpts preview
└── api/programs/[id]/
    ├── attendance/route.ts                # NEW: PATCH attendance
    └── evaluations/route.ts               # NEW: GET evaluations
```

### Pattern 1: Roster Extension with Attendance Columns

**What:** Add attendance columns after the existing block columns in the roster table
**When to use:** When displaying who attended vs who registered
**Example:**
```typescript
// Source: Extend existing registrations-roster.tsx pattern
// Add attendance columns after block columns in the table header:
{blocks.map((block) => (
  <>
    {/* Existing registration column */}
    <th key={block.id}>...</th>
    {/* NEW: Attendance column */}
    <th key={`${block.id}-attended`}>Attended</th>
  </>
))}

// In row render:
{blocks.map((block) => (
  <>
    <td key={block.id}>
      {/* Existing check/x for registration */}
    </td>
    <td key={`${block.id}-attended`}>
      <AttendanceCheckbox
        registrationId={reg.id}
        blockId={block.id}
        attended={reg.attendance?.[block.id] ?? false}
        disabled={isCancelled(reg) || !isBlockSelected(...)}
        onToggle={handleAttendanceToggle}
      />
    </td>
  </>
))}
```

### Pattern 2: Immediate-Save Checkbox (From Logistics)

**What:** Checkbox that saves to database on click without explicit submit
**When to use:** For attendance tracking checkboxes
**Example:**
```typescript
// Source: Adapted from logistics-card.tsx InlineCheckbox
async function handleAttendanceToggle(registrationId: string, blockId: string, attended: boolean) {
  try {
    const res = await fetch(`/api/programs/${programId}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, blockId, attended }),
    });

    if (res.ok) {
      toast.success('Attendance saved');
      // Optimistic update or refetch
    } else {
      toast.error('Failed to save attendance');
    }
  } catch {
    toast.error('Failed to save attendance');
  }
}
```

### Pattern 3: Expandable Response Cards

**What:** Collapsible cards showing individual evaluation responses
**When to use:** For displaying per-attendee evaluation details
**Example:**
```typescript
// Source: Adapted from LogisticsCard pattern
interface IndividualResponseCardProps {
  attendeeName: string;
  programName: string;
  responseDate: string;
  ratings: { category: string; score: number }[];
  freeTextResponses: { question: string; answer: string }[];
  expanded: boolean;
  onToggle: () => void;
}

export function IndividualResponseCard({ ... }: IndividualResponseCardProps) {
  return (
    <div className="rounded-lg border bg-card">
      <button onClick={onToggle} className="w-full p-3 flex items-center justify-between">
        <span className="font-medium">{attendeeName}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Overall: {ratings.find(r => r.category === 'overall')?.score}/5
          </span>
          <ChevronDown className={cn('h-4 w-4', expanded && 'rotate-180')} />
        </div>
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t space-y-3">
          {/* Rating details */}
          {/* Free-text responses */}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Aggregate Score Display with Color Coding

**What:** Display average scores with green/yellow/red color coding
**When to use:** For the aggregate evaluation summary
**Example:**
```typescript
// Source: Based on CONTEXT.md color coding decisions
function getScoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-600 bg-emerald-50';     // Green: 4-5
  if (score >= 3) return 'text-amber-600 bg-amber-50';         // Yellow: 3
  return 'text-red-600 bg-red-50';                              // Red: 1-2
}

// Usage in aggregate display:
<div className="grid grid-cols-4 gap-4">
  {categories.map(category => (
    <div key={category.name} className="text-center">
      <span className={cn('text-2xl font-bold rounded-lg px-3 py-1', getScoreColor(category.average))}>
        {category.average.toFixed(1)}
      </span>
      <p className="text-sm text-muted-foreground mt-1">{category.name}</p>
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid

- **Don't create separate table for attendance:** Store attendance as JSONB column on registrations table (`attendance_by_block JSONB`)
- **Don't build custom survey form builder:** Use fixed template structure stored in Supabase
- **Don't pre-fetch all evaluation responses:** Load on tab mount, paginate if needed
- **Don't duplicate roster logic:** Extend existing `RegistrationsRoster` component

## Don't Hand-Roll

Problems that have existing solutions in the codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expandable cards | Custom accordion | `LogisticsCard` pattern | Already handles expand/collapse with animations |
| Immediate-save checkboxes | Custom save logic | `InlineCheckbox` pattern | Handles saving state and toast notifications |
| API route structure | Custom patterns | Copy from `/api/programs/[id]/logistics/route.ts` | Established PATCH pattern with field updates |
| Toast notifications | Custom UI | `sonner` toast | Project standard, already configured |
| Color-coded badges | Custom styling | `Badge` component with variants | Established health/warning/critical variants |

**Key insight:** This phase is primarily about extending existing patterns, not creating new ones. The Logistics tab established the immediate-save pattern, the Roster component has the table structure, and LogisticsCard provides expandable card UI.

## Common Pitfalls

### Pitfall 1: Checkbox State Desync
**What goes wrong:** Checkbox shows checked but database has unchecked (or vice versa)
**Why it happens:** Optimistic updates without proper error handling, race conditions
**How to avoid:**
1. Use optimistic updates but revert on API failure
2. Disable checkbox during save operation (shown in `InlineCheckbox` pattern)
3. Show toast on error with clear message
**Warning signs:** Flashing checkboxes, inconsistent state after refresh

### Pitfall 2: N+1 Queries for Evaluations
**What goes wrong:** Loading individual evaluation responses one at a time
**Why it happens:** Forgetting to batch load responses with registrations
**How to avoid:**
1. Create a Supabase view that joins registrations with evaluation responses
2. Load all responses for program in single query
3. Paginate if response count is large (>50 responses)
**Warning signs:** Slow tab load, multiple network requests in dev tools

### Pitfall 3: Virtual Certificate Complexity
**What goes wrong:** Attendance tracking breaks for virtual certificates spanning multiple blocks
**Why it happens:** Each block is a separate program_instance; need to link attendance
**How to avoid:**
1. For virtual certificates, show all linked blocks in attendance section
2. Use `parent_program_id` to find linked blocks
3. Query attendance across all linked program_instances
**Warning signs:** Incomplete certificate progress display, missing block attendance

### Pitfall 4: Bulk Action Without Confirmation
**What goes wrong:** User accidentally marks all as attended
**Why it happens:** One-click bulk action modifies many records
**How to avoid:** Per CONTEXT.md: "Mark all attended" should have brief confirmation dialog
**Warning signs:** Support requests about accidental bulk changes

### Pitfall 5: Empty State Confusion
**What goes wrong:** Users confused when no evaluations appear
**Why it happens:** No clear messaging about when evaluations become available
**How to avoid:**
1. Show clear empty state: "Evaluation responses will appear here after the program completes and attendees submit their feedback."
2. Show evaluation submission rate if some have responded
**Warning signs:** Support questions about missing evaluations

## Code Examples

Verified patterns from official sources (existing codebase):

### Roster Table Structure (Existing)
```typescript
// Source: dashboard/src/app/dashboard/programs/components/registrations-roster.tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-border bg-muted/30">
      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Name
      </th>
      {/* Dynamic block columns */}
      {blocks.map((block) => (
        <th
          key={block.id}
          className="text-center px-3 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider"
          title={block.name}
        >
          {block.shortName}
        </th>
      ))}
      {/* More columns... */}
    </tr>
  </thead>
  <tbody>
    {registrations.map((reg) => (
      <tr
        key={reg.id}
        className={cn(
          'border-b border-border/50 transition-colors cursor-pointer',
          isCancelled(reg) ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/50'
        )}
      >
        {/* Row content */}
      </tr>
    ))}
  </tbody>
</table>
```

### PATCH API Route Pattern (Existing)
```typescript
// Source: dashboard/src/app/api/programs/[id]/logistics/route.ts
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // Single field update
    if (body.field && body.value !== undefined) {
      const result = await updateLogisticsField(id, body.field, body.value);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    );
  }
}
```

### Cancelled Registration Styling (Existing)
```typescript
// Source: registrations-roster.tsx
function isCancelled(reg: RegistrationRosterItem): boolean {
  return reg.registration_status === 'Cancelled' || reg.cancelled_at !== null;
}

// In JSX:
<div className={cn(cancelled && 'line-through text-muted-foreground')}>
  {/* Content */}
</div>
```

## Database Schema Design

### New Tables Required

#### Table: `evaluation_templates`
```sql
CREATE TABLE evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- Fixed structure per CONTEXT.md decisions
  rating_categories JSONB NOT NULL DEFAULT '[
    {"key": "instructor", "label": "Instructor Quality", "description": "Knowledge, presentation, responsiveness"},
    {"key": "content", "label": "Content/Materials", "description": "Relevance, clarity, usefulness"},
    {"key": "venue", "label": "Venue/Logistics", "description": "Location, food, facilities", "virtual_skip": true},
    {"key": "overall", "label": "Overall Satisfaction", "description": "Would recommend, met expectations"}
  ]'::jsonb,
  free_text_questions JSONB NOT NULL DEFAULT '[
    {"key": "liked_most", "question": "What did you like most?"},
    {"key": "improvements", "question": "What could be improved?"}
  ]'::jsonb,
  rating_scale_min INTEGER DEFAULT 1,
  rating_scale_max INTEGER DEFAULT 5,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default template
INSERT INTO evaluation_templates (name, is_default)
VALUES ('Standard Post-Program Evaluation', true);
```

#### Table: `evaluation_responses`
```sql
CREATE TABLE evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  program_instance_id UUID NOT NULL REFERENCES program_instances(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES evaluation_templates(id),
  -- Rating responses stored as JSONB
  ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"instructor": 5, "content": 4, "venue": 3, "overall": 4}
  free_text_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"liked_most": "Great instructor!", "improvements": "More breaks"}
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluation_responses_program ON evaluation_responses(program_instance_id);
CREATE INDEX idx_evaluation_responses_registration ON evaluation_responses(registration_id);
```

#### Column Addition: `registrations.attendance_by_block`
```sql
-- Add attendance tracking to existing registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance_by_block JSONB DEFAULT '{}'::jsonb;
-- Example: {"block_1": true, "block_2": false, "block_3": true}
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS marked_attended_at TIMESTAMPTZ;

COMMENT ON COLUMN registrations.attendance_by_block IS 'JSONB mapping block_id to attendance boolean';
```

### View for Aggregate Scores
```sql
CREATE VIEW evaluation_aggregate_scores AS
SELECT
  program_instance_id,
  COUNT(*) as response_count,
  AVG((ratings->>'instructor')::numeric) as avg_instructor,
  AVG((ratings->>'content')::numeric) as avg_content,
  AVG((ratings->>'venue')::numeric) as avg_venue,
  AVG((ratings->>'overall')::numeric) as avg_overall
FROM evaluation_responses
GROUP BY program_instance_id;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Form mode with submit button | Immediate-save checkboxes | Phase 4 | Faster workflow, per CONTEXT.md |
| Separate attendance page | Same tab as roster | CONTEXT.md decision | Less context switching |
| Custom modal dialogs | Sheet slide-out panels | Phase 3 | Consistent UX pattern |

**Current in codebase:**
- Tabs component for switching between Registrations/Logistics/Attendance
- Sheet component for slide-out panels
- LogisticsCard for expandable sections
- InlineCheckbox for immediate-save checkboxes

## Open Questions

Things that require implementation decisions:

1. **Attendance API granularity**
   - What we know: Need to save attendance per-block per-registration
   - What's unclear: Single API call per checkbox, or batch for "Mark all attended"?
   - Recommendation: Single call per checkbox, batch endpoint for bulk action

2. **Evaluation response data source**
   - What we know: Evaluations stored in Supabase
   - What's unclear: How do evaluations get INTO the system? External form?
   - Recommendation: Assume external form submits to Supabase; this phase just displays

3. **Virtual certificate attendance linking**
   - What we know: Virtual blocks have `parent_program_id`
   - What's unclear: How to show aggregate attendance across linked blocks
   - Recommendation: Query all child program_instances and combine attendance data

## Sources

### Primary (HIGH confidence)
- Existing codebase: `registrations-roster.tsx` - roster table structure
- Existing codebase: `logistics-card.tsx` - expandable card and checkbox patterns
- Existing codebase: `programs-mutations.ts` - PATCH update pattern
- CONTEXT.md: User decisions for Phase 5

### Secondary (MEDIUM confidence)
- `20260201_logistics_tab_schema.sql` - migration pattern for schema extension
- `program-detail-content.tsx` - tab structure and state management

### Tertiary (LOW confidence)
- Evaluation form structure - assumed based on CONTEXT.md decisions, actual form may differ

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase
- Architecture: HIGH - Clear patterns from Phases 2-4
- Database schema: HIGH - Follows existing migration patterns
- Pitfalls: MEDIUM - Some based on general React/Next.js experience

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - stable domain)
