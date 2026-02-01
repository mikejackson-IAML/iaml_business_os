# Phase 4: Logistics Tab - Research

**Researched:** 2026-02-01
**Domain:** Expandable card UI, inline editing, file uploads (Supabase Storage), audit logging, expense tracking
**Confidence:** HIGH

## Summary

Phase 4 builds a Logistics Tab with expandable checklist cards showing operational preparation status. Each card (10 for in-person, 6 for virtual) displays collapsed status summary and expands for inline editing. The tab includes expense tracking with file attachments for receipts and audit logging for all changes.

The codebase has established patterns for all required elements: (1) EngagementCard pattern from Phase 3 provides expandable card UI, (2) AttachmentUpload component from Lead Intelligence provides file upload with Supabase Storage, (3) activity_log table provides polymorphic audit logging, (4) Card and section components from dashboard-kit match visual style. Virtual programs hide irrelevant cards entirely.

**Primary recommendation:** Extend program_logistics table for all 10/6 checklist items, reuse EngagementCard pattern for expandable cards with inline editing, create program_expenses table for expense tracking, use existing activity_log table for audit trails.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @radix-ui/react-collapsible | (via dialog) | Expandable sections | Available via Radix |
| lucide-react | ^0.562.0 | Icons | Installed |
| sonner | ^2.0.7 | Toast notifications | Installed |
| @supabase/supabase-js | ^2.90.1 | Database + Storage | Installed |

### Existing Components to Reuse
| Component | Location | Purpose |
|-----------|----------|---------|
| EngagementCard | `/programs/components/contact-panel/engagement-section.tsx` | Expandable card pattern with chevron |
| AttachmentUpload | `/lead-intelligence/opportunities/components/attachment-upload.tsx` | File upload with drag & drop |
| Card, CardHeader, CardContent | `/dashboard-kit/components/ui/card.tsx` | Base card styling |
| LogisticsProgress | `/programs/components/logistics-progress.tsx` | Progress indicator |
| ChecklistProgress | `/dashboard-kit/components/dashboard/checklist-progress.tsx` | Checklist with progress bar |

### No Additional Installations Needed

All required functionality exists in the codebase.

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/dashboard/programs/
│   ├── [id]/
│   │   └── program-detail-content.tsx  # Add Logistics tab content
│   └── components/
│       └── logistics/
│           ├── logistics-tab.tsx          # Main tab container
│           ├── logistics-card.tsx         # Base expandable card
│           ├── instructor-card.tsx        # PROG-34
│           ├── hotel-card.tsx             # PROG-35, PROG-36
│           ├── room-block-card.tsx        # PROG-37
│           ├── venue-card.tsx             # PROG-38
│           ├── beo-card.tsx               # PROG-39 (with file upload)
│           ├── materials-card.tsx         # PROG-40 (7-item checklist)
│           ├── av-card.tsx                # PROG-41
│           ├── expenses-section.tsx       # PROG-42
│           └── expense-row.tsx            # Individual expense with attachment
├── lib/api/
│   ├── programs-queries.ts               # Existing - add logistics queries
│   └── programs-mutations.ts             # New - update mutations
└── app/api/programs/
    ├── [id]/logistics/route.ts           # GET/PATCH logistics data
    ├── [id]/expenses/route.ts            # CRUD expenses
    └── [id]/attachments/route.ts         # File uploads for BEO/receipts
```

### Pattern 1: Expandable Logistics Card (from EngagementCard)

**What:** Clickable header with chevron that expands to show form fields
**When to use:** All 10/6 logistics items

**Example (adapted from engagement-section.tsx):**
```typescript
// Source: /dashboard/src/app/dashboard/programs/components/contact-panel/engagement-section.tsx
interface LogisticsCardProps {
  title: string;
  icon: ReactNode;
  statusSummary: string;       // "John Smith (confirmed)" or "Not booked"
  statusIndicator: 'complete' | 'warning' | 'incomplete';
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;         // Inline edit form
}

function LogisticsCard({
  title,
  icon,
  statusSummary,
  statusIndicator,
  expanded,
  onToggle,
  children,
}: LogisticsCardProps) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Status icon */}
          {statusIndicator === 'complete' && (
            <Check className="h-4 w-4 text-emerald-500" />
          )}
          {statusIndicator === 'warning' && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          {statusIndicator === 'incomplete' && (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{statusSummary}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Pattern 2: Inline Editing with Auto-Save on Blur

**What:** Form fields become editable in expanded card, save on blur
**When to use:** Simple text/date/checkbox fields per CONTEXT.md decision

**Example:**
```typescript
// Auto-save pattern for simple fields
function InlineTextField({
  value,
  onSave,
  label,
  placeholder,
}: InlineTextFieldProps) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    if (localValue !== value) {
      setSaving(true);
      await onSave(localValue);
      setSaving(false);
      toast.success(`${label} updated`);
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground uppercase">{label}</label>
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={saving}
        className={cn(saving && 'opacity-50')}
      />
    </div>
  );
}
```

### Pattern 3: File Upload with Supabase Storage

**What:** Drag & drop file upload storing to Supabase Storage bucket
**When to use:** BEO documents (PROG-39), expense receipts (PROG-42)

**Example (from attachment-upload.tsx):**
```typescript
// Source: /dashboard/src/app/dashboard/lead-intelligence/opportunities/components/attachment-upload.tsx

// Storage bucket pattern
const BUCKET_NAME = 'program-attachments';  // Create new bucket

async function ensureBucket() {
  const supabase = getServerClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  }
}

// Upload pattern
const storagePath = `programs/${programId}/beo/${timestamp}-${file.name}`;
const { error: uploadError } = await supabase.storage
  .from(BUCKET_NAME)
  .upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

// Generate signed URL for download (1 hour expiry)
const { data } = await supabase.storage
  .from(BUCKET_NAME)
  .createSignedUrl(storagePath, 3600);
```

### Pattern 4: Polymorphic Audit Logging

**What:** Log all changes to activity_log table with entity_type/entity_id
**When to use:** Every logistics field update per CONTEXT.md decision

**Example (from lead-intelligence schema):**
```typescript
// Source: supabase/migrations/2026020302_create_lead_intelligence_contacts_schema.sql

// Table structure (already exists)
// activity_log: id, entity_type, entity_id, action, details (jsonb), created_at

// Logging a change
async function logChange(
  programId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown
) {
  const supabase = getServerClient();
  await supabase.from('activity_log').insert({
    entity_type: 'program_logistics',
    entity_id: programId,
    action: 'field_updated',
    details: {
      field,
      old_value: oldValue,
      new_value: newValue,
      updated_by: 'user', // Replace with actual user ID when auth added
      updated_at: new Date().toISOString(),
    },
  });
}
```

### Pattern 5: Expense Category Grouping

**What:** Group expenses by category with subtotals
**When to use:** Expenses section per CONTEXT.md decision

**Example:**
```typescript
// Categories from AUTONOMOUS-BUILD-GUIDE
const EXPENSE_CATEGORIES = [
  'Accommodations',  // Hotel costs
  'Venue',           // Rental, F&B
  'Materials',       // Printing, shipping
  'Equipment',       // AV purchase/rental
  'Other',
] as const;

interface ProgramExpense {
  id: string;
  program_id: string;
  category: typeof EXPENSE_CATEGORIES[number];
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
}

// Display grouped with subtotals
function groupExpensesByCategory(expenses: ProgramExpense[]) {
  return EXPENSE_CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const subtotal = items.reduce((sum, e) => sum + e.amount, 0);
    return { category, items, subtotal };
  }).filter((g) => g.items.length > 0);
}
```

### Anti-Patterns to Avoid

- **Avoid modal dialogs for editing:** User decided inline editing in expanded cards
- **Avoid separate edit mode:** Fields are always editable when expanded
- **Avoid showing all cards for virtual:** Virtual programs hide hotel/venue/AV cards entirely
- **Avoid confirmation dialogs for simple edits:** Only confirm on marking complete
- **Avoid real-time validation:** Save on blur, show toast on success/failure

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expandable card UI | Custom toggle/animation | EngagementCard pattern | Established in Phase 3, consistent styling |
| File upload UI | Custom dropzone | AttachmentUpload component | Drag & drop, progress, size limit, delete |
| Storage bucket | Custom S3 integration | Supabase Storage | Already configured, signed URLs |
| Audit logging | Custom history table | activity_log table | Polymorphic, already indexed, query pattern exists |
| Status icons | Custom icon logic | ChecklistProgress icons | Check/Warning/Circle pattern established |
| Progress display | Custom progress UI | LogisticsProgress component | Already styled for programs |

**Key insight:** Every required pattern exists in the codebase. Combine EngagementCard expandable pattern, AttachmentUpload file handling, activity_log audit trail, and ChecklistProgress status icons.

## Common Pitfalls

### Pitfall 1: Stale Data After Inline Edit
**What goes wrong:** Card shows old value after blur saves new value
**Why it happens:** Component state not updated after API call
**How to avoid:** Optimistic update local state, revalidate on focus
**Warning signs:** Need to collapse/expand to see updated value

### Pitfall 2: File Upload Bucket Not Existing
**What goes wrong:** First upload fails with "bucket not found"
**Why it happens:** Storage bucket not created before first use
**How to avoid:** Use `ensureBucket()` pattern from AttachmentUpload
**Warning signs:** 404 errors in production

### Pitfall 3: Virtual Programs Showing All Cards
**What goes wrong:** Virtual programs show hotel/venue/AV cards
**Why it happens:** Missing format check before rendering cards
**How to avoid:** Check `program.format === 'virtual'` at top of logistics tab
**Warning signs:** Irrelevant fields for virtual programs

### Pitfall 4: Expense Totals Not Updating
**What goes wrong:** Grand total doesn't reflect added/deleted expenses
**Why it happens:** Total calculated on initial load, not recalculated
**How to avoid:** Derive totals from expense array state, not separate state
**Warning signs:** Total shows wrong amount after add/delete

### Pitfall 5: BEO Status Logic Incorrect
**What goes wrong:** BEO shows "uploaded" but status is draft
**Why it happens:** Confusing upload status with document status
**How to avoid:** Separate `beo_uploaded` (boolean) from `beo_status` (draft/final)
**Warning signs:** Users confused about BEO readiness

### Pitfall 6: Audit Log Missing Field Context
**What goes wrong:** Log shows "updated" but not what changed
**Why it happens:** Only logging new value, not old value or field name
**How to avoid:** Include field name, old value, new value in details JSON
**Warning signs:** Can't understand what changed from audit trail

## Code Examples

### Database Schema: program_logistics Table Extension

```sql
-- Extend existing program_logistics or create new columns
-- Based on AUTONOMOUS-BUILD-GUIDE 10 in-person / 6 virtual items

-- In-person checklist fields (10 items)
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS
  instructor_assigned BOOLEAN DEFAULT FALSE,
  instructor_name TEXT,
  instructor_contact TEXT,
  instructor_confirmed_at TIMESTAMPTZ,

  my_hotel_name TEXT,
  my_hotel_dates TEXT,
  my_hotel_confirmation TEXT,
  my_hotel_booked_at TIMESTAMPTZ,

  instructor_hotel_name TEXT,
  instructor_hotel_dates TEXT,
  instructor_hotel_confirmation TEXT,
  instructor_hotel_booked_at TIMESTAMPTZ,

  room_block_hotel TEXT,
  room_block_rooms INTEGER,
  room_block_cutoff DATE,
  room_block_booked INTEGER DEFAULT 0,
  room_block_secured_at TIMESTAMPTZ,

  venue_location TEXT,
  venue_daily_rate NUMERIC(10,2),
  venue_fb_minimum NUMERIC(10,2),
  venue_confirmed_at TIMESTAMPTZ,

  beo_url TEXT,
  beo_status TEXT DEFAULT 'draft' CHECK (beo_status IN ('draft', 'final')),
  beo_uploaded_at TIMESTAMPTZ,

  materials_sent_to_instructor BOOLEAN DEFAULT FALSE,
  materials_sent_at TIMESTAMPTZ,
  materials_printed BOOLEAN DEFAULT FALSE,
  materials_printed_at TIMESTAMPTZ,
  materials_shipped BOOLEAN DEFAULT FALSE,
  materials_shipped_at TIMESTAMPTZ,
  materials_tracking TEXT,

  av_purchased BOOLEAN DEFAULT FALSE,
  av_purchased_at TIMESTAMPTZ,
  av_shipped BOOLEAN DEFAULT FALSE,
  av_shipped_at TIMESTAMPTZ,
  av_tracking TEXT;

-- Virtual-only fields (6 items - some overlap with in-person)
ALTER TABLE program_logistics ADD COLUMN IF NOT EXISTS
  materials_feedback_received BOOLEAN DEFAULT FALSE,
  materials_feedback_at TIMESTAMPTZ,
  materials_updated BOOLEAN DEFAULT FALSE,
  materials_updated_at TIMESTAMPTZ,
  platform_ready BOOLEAN DEFAULT FALSE,
  platform_link TEXT,
  platform_ready_at TIMESTAMPTZ,
  calendar_invites_sent BOOLEAN DEFAULT FALSE,
  calendar_invites_at TIMESTAMPTZ,
  reminder_emails_sent BOOLEAN DEFAULT FALSE,
  reminder_emails_at TIMESTAMPTZ;

-- Index for program lookup
CREATE INDEX IF NOT EXISTS idx_program_logistics_program_id
  ON program_logistics(program_instance_id);
```

### Database Schema: program_expenses Table

```sql
-- New table for expense tracking (PROG-42)
CREATE TABLE IF NOT EXISTS program_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID NOT NULL REFERENCES program_instances(id),
  category TEXT NOT NULL CHECK (category IN (
    'Accommodations', 'Venue', 'Materials', 'Equipment', 'Other'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE,
  receipt_url TEXT,          -- Storage path, not full URL
  receipt_file_name TEXT,
  receipt_file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_program_expenses_program_id ON program_expenses(program_instance_id);
CREATE INDEX idx_program_expenses_category ON program_expenses(category);
```

### API Route: Logistics Update with Audit Logging

```typescript
// Source: Pattern from existing API routes
// app/api/programs/[id]/logistics/route.ts

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = getServerClient();

  const body = await request.json();
  const { field, value } = body;

  // Get current value for audit log
  const { data: current } = await supabase
    .from('program_logistics')
    .select(field)
    .eq('program_instance_id', id)
    .single();

  const oldValue = current?.[field];

  // Update the field
  const { error: updateError } = await supabase
    .from('program_logistics')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('program_instance_id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the change (per CONTEXT.md requirement)
  await supabase.from('activity_log').insert({
    entity_type: 'program_logistics',
    entity_id: id,
    action: 'field_updated',
    details: {
      field,
      old_value: oldValue,
      new_value: value,
      updated_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ success: true });
}
```

### Component: Materials Checklist (7 items)

```typescript
// PROG-40: Materials workflow checklist
const MATERIALS_ITEMS = [
  { id: 'assigned', label: 'Instructor Assigned', field: 'instructor_assigned' },
  { id: 'sent', label: 'Materials Sent to Instructor', field: 'materials_sent_to_instructor' },
  { id: 'feedback', label: 'Feedback Received', field: 'materials_feedback_received' },
  { id: 'updated', label: 'Materials Updated', field: 'materials_updated' },
  { id: 'printed', label: 'Printed', field: 'materials_printed' },
  { id: 'shipped', label: 'Shipped', field: 'materials_shipped' },
  { id: 'tracking', label: 'Tracking Number Added', field: 'materials_tracking' },
] as const;

function MaterialsCard({ logistics, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const completed = MATERIALS_ITEMS.filter((item) => logistics[item.field]).length;

  return (
    <LogisticsCard
      title="Materials"
      icon={<Package className="h-4 w-4" />}
      statusSummary={`${completed}/${MATERIALS_ITEMS.length} complete`}
      statusIndicator={completed === MATERIALS_ITEMS.length ? 'complete' : 'incomplete'}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div className="space-y-2">
        {MATERIALS_ITEMS.map((item) => (
          <label key={item.id} className="flex items-center gap-2">
            <Checkbox
              checked={!!logistics[item.field]}
              onCheckedChange={(checked) =>
                onUpdate(item.field, checked)
              }
            />
            <span className="text-sm">{item.label}</span>
          </label>
        ))}

        {logistics.materials_shipped && (
          <div className="pt-2">
            <InlineTextField
              label="Tracking Number"
              value={logistics.materials_tracking || ''}
              onSave={(val) => onUpdate('materials_tracking', val)}
              placeholder="Enter tracking number"
            />
          </div>
        )}
      </div>
    </LogisticsCard>
  );
}
```

### Component: Virtual Program Badge and Card Filtering

```typescript
// PROG-44: Virtual programs hide irrelevant cards
function LogisticsTab({ program, logistics }) {
  const isVirtual = program.format === 'virtual';

  return (
    <div className="space-y-4">
      {/* Virtual Program Badge */}
      {isVirtual && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
          <Monitor className="h-4 w-4" />
          <span>Virtual Program - Showing applicable logistics only</span>
        </div>
      )}

      {/* People Section - Always shown */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">People</h3>
        <InstructorCard logistics={logistics} />
      </section>

      {/* Accommodations - In-person only */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Accommodations</h3>
          <div className="space-y-2">
            <MyHotelCard logistics={logistics} />
            <InstructorHotelCard logistics={logistics} />
            <RoomBlockCard logistics={logistics} />
          </div>
        </section>
      )}

      {/* Venue - In-person only */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Venue</h3>
          <div className="space-y-2">
            <VenueCard logistics={logistics} />
            <BEOCard logistics={logistics} />
          </div>
        </section>
      )}

      {/* Virtual-specific */}
      {isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Virtual Setup</h3>
          <div className="space-y-2">
            <PlatformReadyCard logistics={logistics} />
            <CalendarInvitesCard logistics={logistics} />
            <ReminderEmailsCard logistics={logistics} />
          </div>
        </section>
      )}

      {/* Materials - Both */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Materials</h3>
        <MaterialsCard logistics={logistics} isVirtual={isVirtual} />
      </section>

      {/* Equipment - In-person only */}
      {!isVirtual && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Equipment</h3>
          <AVCard logistics={logistics} />
        </section>
      )}

      {/* Expenses - Both (post-program) */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Expenses</h3>
        <ExpensesSection programId={program.id} />
      </section>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal dialogs for editing | Inline editing in cards | Phase 4 design decision | Faster workflow, less context switching |
| Separate edit/view modes | Always-editable fields | Phase 4 design decision | Simpler UX |
| Custom file handling | Supabase Storage | Established pattern | Managed service, signed URLs |
| Per-entity history tables | Polymorphic activity_log | Lead Intelligence pattern | Single table for all entities |

**Current best practices:**
- EngagementCard pattern from Phase 3 for expandable sections
- AttachmentUpload component for file handling
- activity_log table for audit trails
- Auto-save on blur for simple fields, explicit save for forms

## Open Questions

Things that couldn't be fully resolved:

1. **Instructor Assignment Data Source**
   - What we know: Instructors are stored in `faculty` table
   - What's unclear: How to assign instructors to programs (new join table needed?)
   - Recommendation: Create `program_instructor_assignments` junction table or use existing faculty scheduler integration

2. **Room Block vs Block Size Fields**
   - What we know: `room_blocks` table exists with hotel_name, rooms_booked, block_size, cutoff_date
   - What's unclear: Should logistics card read from room_blocks or duplicate in program_logistics?
   - Recommendation: Reference room_blocks table, don't duplicate data

3. **Expense Receipt Storage Limits**
   - What we know: Lead Intelligence attachments use 10MB limit
   - What's unclear: Is 10MB appropriate for receipt images?
   - Recommendation: Use same 10MB limit, support PDF/PNG/JPG

## Sources

### Primary (HIGH confidence)
- EngagementCard pattern: `/dashboard/src/app/dashboard/programs/components/contact-panel/engagement-section.tsx`
- AttachmentUpload component: `/dashboard/src/app/dashboard/lead-intelligence/opportunities/components/attachment-upload.tsx`
- Attachment API route: `/dashboard/src/app/api/lead-intelligence/opportunities/[id]/attachments/route.ts`
- activity_log schema: `/supabase/migrations/2026020302_create_lead_intelligence_contacts_schema.sql`
- ChecklistProgress component: `/dashboard/src/dashboard-kit/components/dashboard/checklist-progress.tsx`
- LogisticsProgress component: `/dashboard/src/app/dashboard/programs/components/logistics-progress.tsx`
- Card component: `/dashboard/src/dashboard-kit/components/ui/card.tsx`
- Phase 3 RESEARCH.md: `/dashboard/.planning-programs/phases/03-contact-panel/03-RESEARCH.md`

### Secondary (MEDIUM confidence)
- program_dashboard_summary view: Shows readiness fields and room_blocks join
- AUTONOMOUS-BUILD-GUIDE: Defines 10 in-person / 6 virtual checklist items
- CONTEXT.md: Specifies inline editing, expense categories, audit requirements

### Tertiary (LOW confidence - needs validation)
- Instructor assignment pattern needs clarification from faculty scheduler or existing data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components exist in codebase
- Architecture patterns: HIGH - Direct patterns from Phase 3 and Lead Intelligence
- Database schema: HIGH - Clear extension of existing tables
- File upload: HIGH - AttachmentUpload component proven
- Audit logging: HIGH - activity_log table pattern established
- Virtual filtering: HIGH - Simple format check
- Expense tracking: MEDIUM - New table, but follows existing patterns

**Research date:** 2026-02-01
**Valid until:** 60 days (stable patterns, no external dependencies)
