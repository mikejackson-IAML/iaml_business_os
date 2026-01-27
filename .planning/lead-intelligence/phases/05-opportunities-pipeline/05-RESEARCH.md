# Phase 5: Opportunities Pipeline - Research

**Researched:** 2026-01-27
**Domain:** Kanban pipeline UI, CRUD API, file uploads (Supabase Storage)
**Confidence:** HIGH

## Summary

This phase builds an opportunities pipeline with kanban board (default) and table views, two separate pipeline tabs (in-house 7-stage, individual 5-stage), drag-and-drop stage advancement, opportunity detail views with contacts/notes/attachments, and Supabase Storage file uploads.

The codebase already has a fully functional kanban board in Planning Studio using `@dnd-kit/core` (already installed). The CRUD pattern is well-established across contacts/companies with a 4-file structure: types, validation, queries, mutations. The database schema is already deployed. No Supabase Storage usage exists yet, so this phase introduces a new pattern.

**Primary recommendation:** Clone the Planning Studio pipeline-board/pipeline-column/project-card pattern for the kanban, follow the contacts CRUD pattern for API, and introduce Supabase Storage with a new bucket for opportunity attachments.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop kanban | Already used in Planning Studio pipeline board |
| @dnd-kit/utilities | ^3.2.2 | CSS transform helpers | Already used in ProjectCard |
| @supabase/supabase-js | ^2.90.1 | Database + Storage API | Already the DB client |
| sonner | ^2.0.7 | Toast notifications | Already used for optimistic update feedback |
| lucide-react | ^0.562.0 | Icons | Already the icon library |

### Supporting (already installed)
| Library | Version | Purpose |
|---------|---------|---------|
| @radix-ui/react-tabs | ^1.1.13 | In-house / Individual tab switching |
| @radix-ui/react-dialog | ^1.1.15 | Create opportunity modal, detail modals |
| @radix-ui/react-select | ^2.2.6 | Stage select, type select, company typeahead |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Row actions menu |

**No new dependencies needed.**

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/
│   ├── api/lead-intelligence/opportunities/
│   │   ├── route.ts                          # GET list + POST create
│   │   └── [id]/
│   │       ├── route.ts                      # GET detail + PATCH update + DELETE
│   │       ├── advance-stage/route.ts        # POST advance stage
│   │       ├── contacts/route.ts             # POST add contact, DELETE remove
│   │       └── attachments/route.ts          # POST upload, GET list
│   └── dashboard/lead-intelligence/
│       ├── opportunities/
│       │   ├── page.tsx                      # /dashboard/lead-intelligence/opportunities
│       │   ├── opportunities-content.tsx      # Client component with tabs + board/table toggle
│       │   ├── components/
│       │   │   ├── opportunity-kanban.tsx     # DndContext wrapper (clone of pipeline-board)
│       │   │   ├── stage-column.tsx           # Droppable column (clone of pipeline-column)
│       │   │   ├── opportunity-card.tsx       # Draggable card (clone of project-card)
│       │   │   ├── opportunity-table.tsx      # Table view with horizontal stage bar
│       │   │   ├── create-opportunity-modal.tsx
│       │   │   ├── opportunity-detail.tsx     # Full detail view (stage viz, contacts, notes, attachments)
│       │   │   └── attachment-upload.tsx      # File upload component
│       │   └── [id]/
│       │       └── page.tsx                  # Dedicated detail page
│       └── companies/[id]/tabs/
│           └── opportunities-tab.tsx         # COMP-04: Opportunities tab on company profile
├── lib/api/
│   ├── lead-intelligence-opportunities-types.ts
│   ├── lead-intelligence-opportunities-validation.ts
│   ├── lead-intelligence-opportunities-queries.ts
│   └── lead-intelligence-opportunities-mutations.ts
```

### Pattern 1: CRUD API (clone contacts pattern)
**What:** 4-file split: types -> validation -> queries -> mutations -> route
**When to use:** Every API resource in lead-intelligence
**Example:**
```typescript
// types.ts
export interface Opportunity {
  id: string;
  title: string;
  type: string | null; // 'in_house' | 'individual'
  stage: string | null;
  company_id: string | null;
  contact_id: string | null;
  value: number | null;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: { id: string; name: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
}

// queries.ts - use `as any` cast pattern
function getOpportunitiesTable() {
  return getServerClient().from('opportunities') as any;
}
```

### Pattern 2: Kanban Board (clone Planning Studio)
**What:** DndContext + useDroppable columns + useDraggable cards with optimistic updates
**When to use:** The kanban view
**Key files to reference:**
- `dashboard/src/app/dashboard/planning/components/pipeline-board.tsx` - DndContext, sensors, optimistic state
- `dashboard/src/app/dashboard/planning/components/pipeline-column.tsx` - useDroppable, styling
- `dashboard/src/app/dashboard/planning/components/project-card.tsx` - useDraggable, CSS transform
- `dashboard/src/app/dashboard/planning/actions.ts` - Server action for drag-end persistence

**Critical implementation details from Planning Studio:**
- `PointerSensor` with `activationConstraint: { distance: 8 }` (prevents accidental drags)
- `rectIntersection` collision detection
- Optimistic update on drag-end with revert on server failure
- `DragOverlay` for the floating card during drag
- Column: `min-w-[280px] w-[280px] flex-shrink-0` in `flex gap-6 overflow-x-auto`
- Drop highlight: `ring-2 ring-primary/30 bg-primary/5`
- Card during drag: `opacity-50`, overlay: `shadow-lg rotate-2`

### Pattern 3: Company Profile Tab Integration
**What:** Add "Opportunities" tab to company profile alongside Contacts, Notes, Enrichment
**Reference:** `dashboard/src/app/dashboard/lead-intelligence/companies/[id]/company-profile-content.tsx`
**How:**
- Add to `TABS` const array: `['Contacts', 'Opportunities', 'Notes', 'Enrichment Data']`
- Lazy-load `OpportunitiesTab` component
- The metric card already has placeholder: `<MetricCard label="Active Opportunities" value="0" description="Coming Phase 5" />`
- Replace with live count from opportunities API

### Pattern 4: Supabase Storage for Attachments
**What:** File upload to Supabase Storage bucket, store URL in opportunity_attachments table
**This is NEW to the codebase.**
```typescript
// Upload pattern
const supabase = getServerClient();
const filePath = `opportunities/${opportunityId}/${Date.now()}-${fileName}`;
const { data, error } = await supabase.storage
  .from('opportunity-attachments')
  .upload(filePath, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  });

// Get public/signed URL
const { data: urlData } = supabase.storage
  .from('opportunity-attachments')
  .getPublicUrl(filePath);
// Store urlData.publicUrl in opportunity_attachments.file_url
```

**Bucket setup required:** Create `opportunity-attachments` bucket in Supabase dashboard or via migration.

### Anti-Patterns to Avoid
- **Don't use @dnd-kit/sortable for kanban:** The board needs inter-column drag (useDroppable/useDraggable), not intra-list sorting. The Planning Studio already solved this correctly.
- **Don't build custom file upload from scratch:** Use Supabase Storage client API directly.
- **Don't combine pipelines in one view:** User decided separate tabs for in-house vs individual.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop kanban | Custom mouse event handlers | @dnd-kit/core (already installed) | Accessibility, touch support, collision detection |
| File upload to cloud | Custom S3/blob storage | Supabase Storage API | Already have Supabase client, built-in |
| Optimistic UI updates | Custom cache invalidation | useState + revert pattern from Planning Studio | Proven pattern in codebase |
| Stage progression logic | Custom state machine | Simple stage array + index lookup | Stages are ordered, skip allowed |

## Common Pitfalls

### Pitfall 1: Forgetting the `as any` cast for untyped tables
**What goes wrong:** TypeScript errors because opportunities/opportunity_contacts/opportunity_attachments are not in the Database type
**How to avoid:** Use the same `as any` cast pattern from contacts: `getServerClient().from('opportunities') as any`

### Pitfall 2: Supabase Storage bucket not existing
**What goes wrong:** Upload fails with 404/bucket not found
**How to avoid:** Create the bucket before deploying. Either via Supabase dashboard or a migration that calls `storage.createBucket`.

### Pitfall 3: File size limits on Next.js API routes
**What goes wrong:** Default Next.js body size limit is ~1MB for API routes
**How to avoid:** Set `export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }` in the attachment route, OR use client-side direct upload to Supabase Storage (bypassing Next.js).

### Pitfall 4: Kanban not updating after drag
**What goes wrong:** State gets stale after server action
**How to avoid:** Follow Planning Studio's pattern: local optimistic state update + server call + revert on failure. Don't rely on revalidation for immediate feedback.

### Pitfall 5: Stage advancement without type check
**What goes wrong:** Advancing an in-house opportunity through individual stages
**How to avoid:** Validate stage against the correct pipeline based on opportunity type:
```typescript
const IN_HOUSE_STAGES = ['inquiry', 'strategy_session', 'consultation', 'proposal_sent', 'planning', 'won', 'lost'];
const INDIVIDUAL_STAGES = ['inquiry', 'info_sent', 'follow_up', 'registered', 'lost'];
```

## Code Examples

### Kanban DndContext Setup (adapted from Planning Studio)
```typescript
// Source: dashboard/src/app/dashboard/planning/components/pipeline-board.tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor)
);

<DndContext
  sensors={sensors}
  collisionDetection={rectIntersection}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {stages.map((stage) => (
    <StageColumn key={stage} stage={stage} opportunities={byStage[stage] || []} />
  ))}
  <DragOverlay>
    {activeOpp ? <OpportunityCard opportunity={activeOpp} isOverlay /> : null}
  </DragOverlay>
</DndContext>
```

### Droppable Column (adapted from Planning Studio)
```typescript
// Source: dashboard/src/app/dashboard/planning/components/pipeline-column.tsx
export function StageColumn({ stage, opportunities }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] w-[280px] flex-shrink-0 flex flex-col rounded-lg p-2 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('h-2.5 w-2.5 rounded-full', stageColor[stage])} />
        <h3 className="text-sm font-medium">{stageLabel(stage)}</h3>
        <Badge variant="secondary" className="text-xs">{opportunities.length}</Badge>
      </div>
      <div className="space-y-3 flex-1 min-h-[200px]">
        {opportunities.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)}
      </div>
    </div>
  );
}
```

### Supabase Storage Upload (API route)
```typescript
// For attachment upload via Next.js API route
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = `opportunities/${params.id}/${Date.now()}-${file.name}`;

  const supabase = getServerClient();
  const { error: uploadError } = await supabase.storage
    .from('opportunity-attachments')
    .upload(filePath, buffer, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('opportunity-attachments')
    .getPublicUrl(filePath);

  // Insert record into opportunity_attachments table
  const { data, error } = await (supabase.from('opportunity_attachments') as any)
    .insert({
      opportunity_id: params.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  return NextResponse.json(data, { status: 201 });
}
```

### CRUD Query Pattern (adapted from contacts)
```typescript
// Source: dashboard/src/lib/api/lead-intelligence-contacts-queries.ts
function getOpportunitiesTable() {
  return getServerClient().from('opportunities') as any;
}

export async function getOpportunities(params: OpportunityListParams) {
  let query = getOpportunitiesTable()
    .select('*, companies(id, name), contacts(id, first_name, last_name)', { count: 'exact' });

  if (params.type) query = query.eq('type', params.type);
  if (params.stage) query = query.eq('stage', params.stage);
  if (params.company_id) query = query.eq('company_id', params.company_id);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  const { data, error, count } = await query
    .order(params.sort || 'created_at', { ascending: params.order === 'asc' })
    .range(from, to);

  return { data, meta: { page, limit, total: count ?? 0, total_pages: Math.ceil((count ?? 0) / limit) } };
}
```

## Database Schema Reference

### opportunities table (deployed)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| title | text NOT NULL | |
| type | text | 'in_house' or 'individual' |
| stage | text | Pipeline stage |
| company_id | uuid FK -> companies | For in-house |
| contact_id | uuid FK -> contacts | For individual |
| value | numeric | Deal value |
| expected_close_date | date | User says skip, but column exists |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### opportunity_contacts (deployed)
| Column | Type | Notes |
|--------|------|-------|
| opportunity_id | uuid PK FK | CASCADE delete |
| contact_id | uuid PK FK | |
| role | text | Decision Maker, Influencer, Champion, End User, Billing Contact |
| created_at | timestamptz | |

### opportunity_attachments (deployed)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| opportunity_id | uuid FK | CASCADE delete |
| file_name | text NOT NULL | |
| file_url | text NOT NULL | Supabase Storage URL |
| file_type | text | MIME type |
| file_size | integer | Bytes |
| uploaded_at | timestamptz | |

## Pipeline Stage Constants

```typescript
export const IN_HOUSE_STAGES = [
  'inquiry', 'strategy_session', 'consultation',
  'proposal_sent', 'planning', 'won', 'lost'
] as const;

export const INDIVIDUAL_STAGES = [
  'inquiry', 'info_sent', 'follow_up', 'registered', 'lost'
] as const;

export const IN_HOUSE_STAGE_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  strategy_session: 'Strategy Session',
  consultation: 'Consultation',
  proposal_sent: 'Proposal Sent',
  planning: 'Planning',
  won: 'Won',
  lost: 'Lost',
};

export const INDIVIDUAL_STAGE_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  info_sent: 'Info Sent',
  follow_up: 'Follow-Up',
  registered: 'Registered',
  lost: 'Lost',
};

export const CONTACT_ROLES = [
  'decision_maker', 'influencer', 'champion', 'end_user', 'billing_contact'
] as const;
```

## Company Profile Integration

The company profile at `companies/[id]/company-profile-content.tsx` already has:
- A tab system with `TABS = ['Contacts', 'Notes', 'Enrichment Data']` -- add 'Opportunities'
- A metrics card placeholder: `<MetricCard label="Active Opportunities" value="0" description="Coming Phase 5" />`
- Lazy-loaded tab components with Suspense

## Open Questions

1. **Supabase Storage bucket access policy:** Should the bucket be public (anyone with URL can download) or private (requires signed URLs)? For proposals/contracts, private with signed URLs is safer. Recommend signed URLs with expiry.

2. **File size limit:** No explicit decision on max attachment size. Recommend 10MB limit per file as reasonable for proposals/contracts.

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20260203_create_lead_intelligence_contacts_schema.sql` - Schema for all 3 opportunity tables
- `dashboard/src/app/dashboard/planning/components/pipeline-board.tsx` - Kanban reference implementation
- `dashboard/src/app/dashboard/planning/components/pipeline-column.tsx` - Droppable column reference
- `dashboard/src/app/dashboard/planning/components/project-card.tsx` - Draggable card reference
- `dashboard/src/lib/api/lead-intelligence-contacts-*.ts` - CRUD pattern (types, validation, queries, mutations)
- `dashboard/src/app/api/lead-intelligence/contacts/route.ts` - API route pattern
- `dashboard/src/app/dashboard/lead-intelligence/companies/[id]/company-profile-content.tsx` - Tab integration target
- `dashboard/package.json` - Confirmed @dnd-kit/core ^6.3.1 installed

### Secondary (MEDIUM confidence)
- Supabase Storage API patterns based on @supabase/supabase-js v2 documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in codebase
- Architecture: HIGH - direct clone of established patterns
- Pitfalls: HIGH - based on actual codebase patterns and known constraints
- Supabase Storage: MEDIUM - new pattern, not yet used in codebase

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable, internal patterns)
