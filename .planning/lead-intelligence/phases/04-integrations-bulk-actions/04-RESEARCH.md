# Phase 4: Integrations & Bulk Actions - Research

**Researched:** 2026-01-27
**Domain:** External API integrations, bulk UI operations, multi-select table patterns
**Confidence:** HIGH

## Summary

Phase 4 enables users to take action at scale on contacts: add to SmartLead campaigns, trigger enrichment, find colleagues via n8n, and create follow-ups. The codebase already has strong patterns for API routes (validateApiKey, NextResponse), toast notifications (sonner), and confirmation dialogs (AlertDialog from radix). The contact table currently has NO checkbox/selection support -- this must be added. No Dialog component exists yet (only AlertDialog) -- one must be generated via shadcn for the campaign modal and find-colleagues modal.

SmartLead API is already used in n8n workflows at `https://server.smartlead.ai/api/v1/campaigns/{id}/leads?api_key={key}`. The dashboard will need its own server-side proxy to avoid exposing the API key. The follow_up_tasks table already exists with `action_center_task_id` column for Action Center sync.

**Primary recommendation:** Build server-side API routes as proxies to SmartLead/enrichment services, add checkbox selection to existing ContactTable, use sonner toast for feedback, use Dialog (new) for campaign/find-colleagues modals and AlertDialog (existing) for bulk confirmations.

## Standard Stack

### Core (Already in Codebase)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| sonner | Toast notifications | Already in layout.tsx, `toast()` function |
| @radix-ui/react-alert-dialog | Confirmation dialogs | AlertDialog component exists at `src/components/ui/alert-dialog.tsx` |
| Next.js API Routes | Server-side proxy to external APIs | All existing routes follow this pattern |
| validateApiKey (task-auth) | API authentication | Used by every existing lead-intelligence API route |

### Needs Adding
| Library | Purpose | How to Add |
|---------|---------|------------|
| @radix-ui/react-dialog | Modal dialogs (campaign picker, find-colleagues results) | `npx shadcn@latest add dialog` |
| @radix-ui/react-checkbox | Table row checkboxes | `npx shadcn@latest add checkbox` |

### Installation
```bash
cd dashboard && npx shadcn@latest add dialog checkbox
```

## Architecture Patterns

### New API Routes Structure
```
src/app/api/lead-intelligence/
  contacts/[id]/
    enrich/route.ts          # POST - single contact enrichment (API-07)
    add-to-campaign/route.ts # POST - add to SmartLead campaign (API-08)
    follow-up/route.ts       # POST - create follow-up task (API-09)
  companies/[id]/
    enrich/route.ts          # POST - company enrichment (API-07)
    find-colleagues/route.ts # POST - trigger n8n webhook (API-10)
  bulk/
    add-to-campaign/route.ts # POST - bulk add to campaign (API-08)
    enrich/route.ts          # POST - bulk enrichment (BULK-02)
    follow-up/route.ts       # POST - bulk follow-up (BULK-03)
  campaigns/route.ts         # GET - list active SmartLead campaigns
```

### New Frontend Components Structure
```
src/app/dashboard/lead-intelligence/
  components/
    contact-table.tsx           # MODIFY: add checkbox column + selection state
    bulk-actions-bar.tsx        # NEW: sticky bar when contacts selected
    add-to-campaign-modal.tsx   # NEW: Dialog with campaign list + duplicate warning
    find-colleagues-modal.tsx   # NEW: Dialog with results + checkboxes
    enrich-button.tsx           # NEW: trigger enrichment from row actions/profile
    follow-up-form.tsx          # NEW: inline form for creating follow-ups
    bulk-confirm-dialog.tsx     # NEW: AlertDialog confirming bulk action
```

### Pattern 1: API Route as External Service Proxy
**What:** All external API calls (SmartLead, enrichment) go through Next.js API routes. Never call external APIs from the browser.
**Why:** API keys stay server-side. Consistent error handling.
**Example:**
```typescript
// src/app/api/lead-intelligence/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const apiKey = process.env.SMARTLEAD_API_KEY;
    const res = await fetch(
      `https://server.smartlead.ai/api/v1/campaigns?api_key=${apiKey}`
    );
    if (!res.ok) throw new Error(`SmartLead API error: ${res.status}`);
    const campaigns = await res.json();
    // Filter to active only
    const active = campaigns.filter((c: { status: string }) => c.status === 'STARTED');
    return NextResponse.json(active);
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', code: 'EXTERNAL_API_ERROR' },
      { status: 502 }
    );
  }
}
```

### Pattern 2: Table Selection State
**What:** Selection state lives in parent component (LeadIntelligenceContent), passed to ContactTable, bubbles up to BulkActionsBar.
**Example:**
```typescript
// In lead-intelligence-content.tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handleSelectAll = (checked: boolean) => {
  setSelectedIds(checked ? new Set(contacts.map(c => c.id)) : new Set());
};

const handleSelectOne = (id: string, checked: boolean) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    checked ? next.add(id) : next.delete(id);
    return next;
  });
};

// Clear selection on page/filter change
useEffect(() => { setSelectedIds(new Set()); }, [searchParams, aiFilters]);
```

### Pattern 3: n8n Webhook Call (from Faculty Scheduler)
**What:** Existing pattern calls n8n webhooks from server actions.
**Example (from faculty-scheduler/actions.ts):**
```typescript
const webhookUrl = 'https://n8n.realtyamp.ai/webhook/find-colleagues';
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ company_name: companyName, company_domain: domain }),
});
```

### Pattern 4: Toast Notifications (Sonner)
**What:** Already configured in layout.tsx. Import `toast` from `sonner`.
**Example:**
```typescript
import { toast } from 'sonner';

// Success
toast.success(`Added ${count} contacts to ${campaignName}`);

// Error
toast.error('Failed to add contacts to campaign');

// Loading with promise
toast.promise(addToCampaign(ids, campaignId), {
  loading: 'Adding contacts...',
  success: `Added ${ids.length} contacts`,
  error: 'Failed to add contacts',
});
```

### Anti-Patterns to Avoid
- **Calling SmartLead API from browser:** API key would be exposed. Always proxy through API routes.
- **Selection state in ContactTable:** Keep it in parent (LeadIntelligenceContent) so BulkActionsBar can access it.
- **Overwriting existing enrichment data:** Fill blanks only. Store raw JSON separately. Flag differences for review.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom portal/overlay | shadcn Dialog (radix) | Focus trap, escape handling, accessibility |
| Confirmation dialogs | Custom confirm() | AlertDialog (already exists) | Accessible, consistent with codebase |
| Toast notifications | Custom notification system | sonner (already configured) | Already in layout.tsx, rich API |
| Checkbox styling | Custom checkbox CSS | shadcn Checkbox (radix) | Consistent with design system |

## Common Pitfalls

### Pitfall 1: SmartLead Duplicate Detection
**What goes wrong:** Adding a contact already in a campaign creates duplicates or errors.
**How to avoid:** Before adding, query SmartLead API to check if email already exists in the campaign. Show duplicates to user with "Already in campaign" badge and let them confirm.

### Pitfall 2: Enrichment Data Overwrite
**What goes wrong:** Enrichment replaces correct manually-entered data.
**How to avoid:** Fill-blanks-only merge strategy. Compare each field: if existing value is non-null, skip. If enriched value differs from existing, flag for review in enrichment_data JSONB with `{ conflicts: [...] }`.

### Pitfall 3: Bulk Action Timeout
**What goes wrong:** Adding 50+ contacts to SmartLead times out the API route.
**How to avoid:** For bulk operations, process sequentially in small batches on the server. Return progress updates via polling or just toast on completion. SmartLead API has rate limits.

### Pitfall 4: Selection State Persists Across Pages
**What goes wrong:** User selects contacts on page 1, navigates to page 2, bulk action includes stale IDs.
**How to avoid:** Clear selectedIds on any filter/sort/page change. Only operate on currently visible + selected contacts.

### Pitfall 5: Missing Dialog Component
**What goes wrong:** Trying to import Dialog from shadcn when it hasn't been generated.
**How to avoid:** Run `npx shadcn@latest add dialog checkbox` before starting development.

## Code Examples

### SmartLead API: List Active Campaigns
```typescript
// SmartLead API endpoint (used in n8n-workflows/supabase-to-smartlead-exporter.json)
// GET https://server.smartlead.ai/api/v1/campaigns?api_key={SMARTLEAD_API_KEY}
// Response: Array of campaign objects with status field
// Filter for status === 'STARTED' to get active campaigns
```

### SmartLead API: Add Lead to Campaign
```typescript
// POST https://server.smartlead.ai/api/v1/campaigns/{campaignId}/leads?api_key={key}
// Body: { lead_list: [{ email, first_name, last_name, company_name }] }
// Source: n8n-workflows/supabase-to-smartlead-exporter.json line 95
```

### Enrichment Merge Logic
```typescript
function mergeEnrichment(existing: Contact, enriched: Record<string, unknown>) {
  const updates: Partial<Contact> = {};
  const conflicts: Array<{ field: string; existing: unknown; enriched: unknown }> = [];

  const fields = ['title', 'department', 'phone', 'linkedin_url', 'seniority_level'] as const;
  for (const field of fields) {
    const enrichedVal = enriched[field];
    if (!enrichedVal) continue;
    if (!existing[field]) {
      updates[field] = enrichedVal as string;
    } else if (existing[field] !== enrichedVal) {
      conflicts.push({ field, existing: existing[field], enriched: enrichedVal });
    }
  }

  return { updates, conflicts };
}
```

### Follow-up Task with Action Center Sync
```typescript
// follow_up_tasks table has action_center_task_id column
// On creation: INSERT into follow_up_tasks
// Then optionally create corresponding Action Center task
// Schema from migration:
// title text NOT NULL, description text, due_date date NOT NULL,
// status text DEFAULT 'pending', priority text DEFAULT 'medium',
// action_center_task_id uuid, contact_id uuid, company_id uuid
```

## Existing Codebase Hooks

### Phase 4 Placeholders Already Built
The following components already have Phase 4 placeholders that need to be activated:
1. **contact-row-actions.tsx** (line 68-71): DisabledItems for "Add to Campaign", "Enrich Contact", "Set Follow-up", "Find Colleagues" -- replace with working actions
2. **enrichment-tab.tsx** (line 171): Disabled "Enrich Now" button -- make functional
3. **follow-ups API** (contacts/[id]/follow-ups/route.ts): GET only -- add POST handler

### Key Existing Files to Modify
| File | Modification |
|------|-------------|
| `contact-table.tsx` | Add checkbox column, selection callbacks |
| `lead-intelligence-content.tsx` | Add selection state, bulk actions bar |
| `contact-row-actions.tsx` | Enable Phase 4 actions |
| `enrichment-tab.tsx` | Enable "Enrich Now" button |
| `contacts/[id]/follow-ups/route.ts` | Add POST handler |

### Environment Variables Needed
| Variable | Purpose | Already Exists |
|----------|---------|----------------|
| `SMARTLEAD_API_KEY` | SmartLead API authentication | Yes (used in n8n) |
| `N8N_WEBHOOK_BASE_URL` | n8n webhook base (https://n8n.realtyamp.ai) | Yes (faculty-scheduler) |

## Open Questions

1. **SmartLead API rate limits:** Unknown exact limits. Recommend batch size of 10-20 for bulk operations with 1s delay between batches. LOW confidence.
2. **Apollo/PhantomBuster API access from dashboard:** Currently only used in n8n workflows. May need to route enrichment through n8n webhooks rather than direct API calls from the dashboard. MEDIUM confidence -- recommend n8n webhook approach for consistency.
3. **Action Center task schema:** The action_center migrations are marked "Already applied (no-op)". Need to verify the actual tasks table schema in Supabase to ensure proper sync. MEDIUM confidence.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: contact-table.tsx, contact-row-actions.tsx, enrichment-tab.tsx, lead-intelligence-content.tsx
- Codebase inspection: API route patterns in contacts/[id]/route.ts
- Codebase inspection: SmartLead API URL from supabase-to-smartlead-exporter.json
- Codebase inspection: n8n webhook pattern from faculty-scheduler/actions.ts
- Codebase inspection: sonner toast in layout.tsx
- Codebase inspection: AlertDialog component, follow_up_tasks schema

### Secondary (MEDIUM confidence)
- SmartLead API structure inferred from n8n workflow JSON

### Tertiary (LOW confidence)
- SmartLead API rate limits (not verified)
- Apollo/PhantomBuster direct API capabilities (only seen in n8n, not dashboard)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all verified in codebase
- Architecture: HIGH - follows established codebase patterns exactly
- Pitfalls: MEDIUM - based on domain knowledge and codebase patterns
- External API integration: MEDIUM - SmartLead URL verified, but rate limits unverified

**Research date:** 2026-01-27
**Valid until:** 2026-02-27
