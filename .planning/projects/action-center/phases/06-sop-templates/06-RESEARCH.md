# Phase 6: SOP Templates - Research

**Researched:** 2026-01-24
**Status:** Complete

## Executive Summary

Phase 6 has a strong foundation. The SOP API (Phase 3) and mastery system are fully implemented. The task detail page (Phase 5) already displays basic SOP info. This phase focuses on:
1. Building SOP management UI (list/detail/edit pages)
2. Adding progressive instructions to task detail based on mastery level
3. Step management with reordering

## 1. Existing SOP Schema

### sop_templates Table
```sql
- id (UUID): Primary key
- name (TEXT): Required, max 200 chars
- description (TEXT): Optional
- category (TEXT): For grouping (e.g., "operations", "marketing")
- department (TEXT): Department ownership
- steps (JSONB): Array of step objects
- version (INTEGER): Auto-incremented on updates
- is_active (BOOLEAN): Can disable SOPs
- times_used (INTEGER): Usage counter
- last_used_at (TIMESTAMPTZ): Last usage timestamp
- variables (JSONB): Template variables for substitution
- created_by / updated_by (UUID): Audit columns
- created_at / updated_at (TIMESTAMPTZ): Timestamps
```

### Step Object Structure (JSONB)
```typescript
interface SOPStep {
  order: number;       // Required, positive integer, unique within SOP
  title: string;       // Required, 1-200 chars
  description: string | null;
  estimated_minutes: number | null;
  links: string[];     // Array of reference URLs
  notes: string | null;
}
```

### Variables Structure (JSONB)
```typescript
variables: Record<string, { description: string; example: string }>
// Example: { "program_name": { description: "Program being delivered", example: "Leadership Excellence" }}
```

## 2. Mastery System (Already Working)

### Storage
- `profiles.task_mastery` (JSONB): `{sop_template_id: mastery_level}`
- Integer values 0-∞

### Mastery Tiers
| Range | Tier | Display Behavior |
|-------|------|------------------|
| 0-2 | Novice | Full step-by-step instructions |
| 3-5 | Developing | Condensed key steps |
| 6-9 | Proficient | Summary + link to full SOP |
| 10+ | Expert | "You know this" + link |

### Database Functions
- `get_user_mastery(user_id, sop_id)` → INTEGER
- `get_mastery_tier(level)` → 'novice'|'developing'|'proficient'|'expert'
- `increment_user_mastery(user_id, sop_id)` → new_level

### Auto-Increment Trigger
**trigger_increment_mastery** fires when:
- Task status changes to 'done'
- Task has both `sop_template_id` AND `assignee_id`

Trigger also increments `sop_templates.times_used` and sets `last_used_at`.

## 3. Existing SOP API

### Endpoints (All Working)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/sops | List with filters, search, pagination |
| POST | /api/sops | Create new SOP |
| GET | /api/sops/:id | Get full SOP detail |
| PATCH | /api/sops/:id | Update SOP fields |

### List Query Parameters
- `category` (filter)
- `department` (filter)
- `is_active` (boolean filter)
- `search` (name/description ilike)
- `cursor` (pagination)
- `limit` (1-100, default 20)
- `sort_by` ('created_at'|'name'|'times_used')
- `sort_order` ('asc'|'desc')

### Type Locations
- Types: `dashboard/src/lib/api/sop-types.ts`
- Queries: `dashboard/src/lib/api/sop-queries.ts`
- Mutations: `dashboard/src/lib/api/sop-mutations.ts`
- Validation: `dashboard/src/lib/api/sop-validation.ts`

## 4. Task-SOP Integration Points

### Task Data Available
From `tasks_extended` view:
- `sop_template_id` (UUID)
- `sop_name` (string)
- `sop_category` (string)

### Current Task Detail Display
Location: `dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx`

Current display (sidebar, lines 333-342):
```tsx
{task.sop_name && (
  <div className="p-4 border-t">
    <h4>SOP</h4>
    <p>{task.sop_name}</p>
    <p className="text-muted-foreground">{task.sop_category}</p>
  </div>
)}
```

### Integration Options for Progressive Instructions
1. **Main content area**: Add "Instructions" section/tab before comments
2. **Expandable sidebar section**: Expand the existing SOP section
3. **Modal/Dialog**: Click SOP name to open instructions

## 5. UI Patterns to Reuse

### From Task List Page
- `task-filters.tsx`: Filter pattern (adapt for category/department)
- `task-table.tsx`: List layout structure
- `view-tabs.tsx`: Tab switching (if needed)
- Badge components for category/status
- Cursor-based pagination

### From Task Detail Page
- Two-column layout (content + sidebar)
- Card-based sections
- Tabs pattern for Comments/Activity
- Dialog patterns for actions

### Component Locations
- `dashboard/src/app/dashboard/action-center/components/`
- `dashboard/src/components/ui/` (shadcn components)

## 6. New API Endpoints Needed

### Mastery Lookup
```
GET /api/sops/:id/mastery
```
Returns current user's mastery level for this SOP.

### Tasks Using SOP
```
GET /api/sops/:id/tasks
```
Returns tasks that reference this SOP (for usage stats click-through).

## 7. Technical Decisions to Make

### Step Reordering
**Options:**
1. `@dnd-kit/core` - Modern, accessible, React-native
2. `react-beautiful-dnd` - Deprecated but stable
3. Native drag events + arrow buttons only

**Recommendation:** `@dnd-kit/core` with arrow button fallback (per context decision)

### Step Editor
**Options:**
1. Plain text with markdown preview
2. Rich text WYSIWYG
3. Simple structured form fields

**Recommendation:** Structured form fields (title, description textarea, etc.) - simpler, matches schema

### Variable Substitution
**Implementation:**
- Simple regex: `str.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || '')`
- Context from task's related entity (program, etc.)

### Time Estimates
- Show per-step time in edit view
- Sum total in list view ("~Y min")
- Consider showing mastery-adjusted time (expert faster)

## 8. File Structure Plan

### New Pages
```
dashboard/src/app/dashboard/action-center/sops/
├── page.tsx                    # SOP list page
├── sop-list-content.tsx        # Main content with list
├── sop-list-skeleton.tsx       # Loading state
├── [id]/
│   ├── page.tsx               # SOP detail page
│   ├── sop-detail-content.tsx # Detail with tabs (Preview/Edit)
│   └── sop-detail-skeleton.tsx
```

### New Components
```
dashboard/src/app/dashboard/action-center/components/
├── sop-category-group.tsx      # Collapsible category section
├── sop-row.tsx                 # SOP list row
├── sop-step-editor.tsx         # Step editing form
├── sop-step-list.tsx           # Sortable step list
├── progressive-instructions.tsx # Mastery-aware display
└── mastery-badge.tsx           # User mastery indicator
```

### Server Actions
```
dashboard/src/app/dashboard/action-center/sop-actions.ts
```

## 9. Edge Cases to Handle

1. **Empty SOP** - SOP with no steps should show warning/prompt to add
2. **Invalid mastery data** - Default to novice (0) if mastery lookup fails
3. **Deleted SOP** - Task with deleted SOP should handle gracefully
4. **Variable not found** - Show `{{variable}}` as-is if no context value
5. **Category with no SOPs** - Hide empty categories in list
6. **Long step descriptions** - Truncate in list, full in detail
7. **Concurrent edits** - Version field prevents overwrites (409 conflict)

## 10. Key Files Reference

### Database
- Schema: `supabase/migrations/20260122_action_center_schema.sql`
- Mastery: `supabase/migrations/20260122_action_center_user_mastery.sql`
- Triggers: `supabase/migrations/20260122_action_center_triggers.sql`

### API
- Types: `dashboard/src/lib/api/sop-types.ts`
- Queries: `dashboard/src/lib/api/sop-queries.ts`
- Mutations: `dashboard/src/lib/api/sop-mutations.ts`

### UI Reference
- Task List: `dashboard/src/app/dashboard/action-center/action-center-content.tsx`
- Task Detail: `dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx`

---

*Research complete: 2026-01-24*
