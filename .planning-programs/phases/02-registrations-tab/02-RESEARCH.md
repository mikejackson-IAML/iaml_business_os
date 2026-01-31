# Phase 2: Registrations Tab - Research

**Researched:** 2026-01-31
**Domain:** Registrations Table with Filtering, Tab Interface, Apollo Enrichment
**Confidence:** HIGH

## Summary

This phase builds the registrations tab as the default tab on the program detail page. The existing codebase has comprehensive patterns for tabs (Radix UI Tabs), filterable tables (URL-based filter state), and Apollo API integration (getApolloCredits in lead-intelligence-queries.ts). The registrations schema already exists with all required fields.

The primary work involves:
1. Creating the program detail route (`/dashboard/programs/[id]`)
2. Implementing a tabbed interface with Registrations as default
3. Building a filterable roster table showing registrant details
4. Handling virtual certificate progress display
5. Setting up Apollo auto-enrichment on new registrations

**Primary recommendation:** Follow the contact-profile-content.tsx tabs pattern, extend registrations-table.tsx for the roster, and use the existing Apollo API integration pattern from lead-intelligence-queries.ts. Add Sheet component from shadcn/ui for the Contact Panel slide-out (Phase 3 dependency).

## Standard Stack

All libraries already exist in the codebase. No new dependencies needed.

### Core (Already in Dashboard)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-tabs | 1.1.13 | Tab interface | Already installed, accessible |
| @radix-ui/react-dialog | 1.1.15 | Sheet/slide-out base | Already installed |
| Supabase | 2.x | Database queries | Already configured |
| React 19 | 19.2.3 | UI library | Already in use |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons | Check/X marks, filter icons |
| sonner | 2.0.7 | Toast notifications | Success/error feedback |
| class-variance-authority | 0.7.1 | Badge/component variants | Status badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom tabs | Radix Tabs | Radix provides accessibility, keyboard nav |
| Sheet from scratch | Dialog + positioning | Sheet pattern is cleaner for slide-out panels |

**Installation:**
```bash
# Sheet component needs to be added (not yet in codebase)
pnpm dlx shadcn@latest add sheet
```

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/app/dashboard/programs/
├── page.tsx                    # Programs list (existing)
├── programs-content.tsx        # List view (existing)
├── [id]/
│   ├── page.tsx               # Detail page Server Component
│   ├── program-detail-content.tsx  # Client component with tabs
│   └── program-detail-skeleton.tsx # Loading state
└── components/
    ├── registrations-tab.tsx      # Registrations roster + filters
    ├── registrations-filters.tsx  # Filter panel for roster
    ├── block-attendance-columns.tsx # Dynamic block columns
    ├── certificate-progress.tsx   # Virtual block progress
    └── contact-panel.tsx          # Slide-out panel (Phase 3)

dashboard/src/lib/api/
└── programs-queries.ts         # EXTEND with:
    # getProgram(id) - single program
    # getRegistrationsForProgram(id, filters)
    # enrichContactWithApollo(email)
```

### Pattern 1: Tabs with Default Value and Lazy Mount
**What:** Tabs component with default value set and lazy-mounted content
**When to use:** Multi-section detail pages
**Example:**
```typescript
// Source: dashboard/src/app/dashboard/lead-intelligence/contacts/[id]/contact-profile-content.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const TAB_IDS = ['registrations', 'logistics', 'attendance'] as const;
type TabId = typeof TAB_IDS[number];

export function ProgramDetailContent({ program, registrations }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('registrations'); // Default to first tab
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(new Set(['registrations']));

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    setMountedTabs((prev) => new Set(prev).add(tab));
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="registrations">Registrations</TabsTrigger>
        <TabsTrigger value="logistics">Logistics</TabsTrigger>
        <TabsTrigger value="attendance">Attendance/Evaluations</TabsTrigger>
      </TabsList>

      <TabsContent value="registrations">
        {mountedTabs.has('registrations') && (
          <RegistrationsTab programId={program.id} registrations={registrations} />
        )}
      </TabsContent>
      {/* ... other tabs */}
    </Tabs>
  );
}
```

### Pattern 2: Dynamic Block Columns for Roster Table
**What:** Generate table columns based on program's block structure
**When to use:** Block-based programs with varying block counts
**Example:**
```typescript
// Generate columns based on program blocks
interface BlockColumn {
  id: string;
  name: string;
  shortName: string; // For header
}

function getBlockColumns(programName: string): BlockColumn[] {
  // Map program types to their blocks
  const blockConfigs: Record<string, BlockColumn[]> = {
    'Certificate in Employee Relations Law': [
      { id: 'block_1', name: 'Comprehensive Labor Relations', shortName: 'Block 1' },
      { id: 'block_2', name: 'Discrimination Prevention', shortName: 'Block 2' },
      { id: 'block_3', name: 'Special Issues', shortName: 'Block 3' },
    ],
    'Certificate in Strategic HR Leadership': [
      { id: 'block_1', name: 'HR Strategy Foundations', shortName: 'Block 1' },
      { id: 'block_2', name: 'Advanced Leadership', shortName: 'Block 2' },
    ],
    // ... other programs
  };

  return blockConfigs[programName] || [];
}
```

### Pattern 3: URL-Based Filter State for Roster
**What:** Filters stored in URL params for shareable/bookmarkable state
**When to use:** Any filterable list
**Example:**
```typescript
// Source: Based on program-filters.tsx pattern
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface RosterFilters {
  paymentStatus: 'all' | 'paid' | 'unpaid' | 'past_due';
  block: string | null;
  company: string | null;
  source: string | null;
}

function updateFilter(key: string, value: string, programId: string) {
  const params = new URLSearchParams(searchParams.toString());
  if (value && value !== '_all') {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  router.push(`/dashboard/programs/${programId}?${params.toString()}`);
}
```

### Pattern 4: Apollo Enrichment API Call
**What:** Server-side API route that calls Apollo's people/match endpoint
**When to use:** On new registration, or manual "Enrich" button
**Example:**
```typescript
// Source: Based on dashboard/src/lib/api/lead-intelligence-queries.ts
interface ApolloEnrichmentResult {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    title: string;
    email: string;
    email_status: 'verified' | 'unverified';
    linkedin_url: string | null;
    photo_url: string | null;
    phone: string | null;
  };
  organization: {
    id: string;
    name: string;
    industry: string;
    estimated_num_employees: number;
    annual_revenue: number | null;
    total_funding: number | null;
    linkedin_url: string | null;
  };
}

export async function enrichContactWithApollo(email: string): Promise<ApolloEnrichmentResult | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        email,
        reveal_personal_emails: false,
        reveal_phone_number: true,
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Apollo enrichment failed:', error);
    return null;
  }
}
```

### Anti-Patterns to Avoid
- **Fetching registrations client-side:** Use Server Components, pass data as props
- **Hardcoding block columns:** Derive from program definition
- **Calling Apollo on every page load:** Only call on registration, cache result
- **Client-side filtering with large lists:** Filter in Supabase query

## Don't Hand-Roll

Problems with existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tabs component | Custom tab state management | `Tabs` from Radix UI | Accessibility, keyboard nav, ARIA |
| Slide-out panel | Dialog + absolute positioning | Sheet component | Proper focus trap, animations |
| Payment status badge | Inline conditional classes | `Badge` component with variants | Consistent styling |
| Check/X marks | Custom SVGs | `Check`, `X` from lucide-react | Consistent icons |
| Toast notifications | Custom alert system | `sonner` | Already integrated |
| Apollo rate limiting | Custom throttling | Next.js `revalidate` + caching | Built-in |

**Key insight:** Phase 1 established the patterns. Reuse registrations-table.tsx structure, extend program-filters.tsx pattern for roster filters.

## Common Pitfalls

### Pitfall 1: Forgetting Virtual Certificate Context
**What goes wrong:** Virtual block registrations shown without parent certificate context
**Why it happens:** Treating all registrations identically
**How to avoid:** Check `parent_program_id`, show "Certificate Progress" section for virtual programs
**Warning signs:** User confused about which blocks are needed for certificate

### Pitfall 2: Block Column Mismatch
**What goes wrong:** Block checkmarks don't align with actual blocks for program
**Why it happens:** Using hardcoded block names instead of program-specific
**How to avoid:** Derive block columns from program's block configuration
**Warning signs:** Wrong number of block columns, incorrect block names

### Pitfall 3: Apollo Rate Limit Exhaustion
**What goes wrong:** Enrichment fails silently, 429 errors
**Why it happens:** Calling Apollo too frequently (600/hour limit)
**How to avoid:** Only enrich on new registration, cache results, show "Enrichment unavailable" gracefully
**Warning signs:** Enrichment suddenly stops working for all contacts

### Pitfall 4: Cancelled Registrations Hidden
**What goes wrong:** Cancelled registrations not visible, confuses reporting
**Why it happens:** Filtering out cancelled by default
**How to avoid:** Show cancelled with visual indicator (strikethrough, badge), include in roster with distinct styling
**Warning signs:** Registration count doesn't match roster count

### Pitfall 5: Missing Sheet Component
**What goes wrong:** Contact Panel click handler does nothing
**Why it happens:** Sheet component not installed
**How to avoid:** Install shadcn Sheet component before implementing row click
**Warning signs:** No slide-out appears when clicking registrant row

## Code Examples

Verified patterns from the codebase:

### Server Page with Dynamic Route
```typescript
// Based on: dashboard/src/app/dashboard/programs/page.tsx pattern
// File: dashboard/src/app/dashboard/programs/[id]/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProgramDetailSkeleton } from './program-detail-skeleton';
import { ProgramDetailContent } from './program-detail-content';
import { getProgram, getRegistrationsForProgram } from '@/lib/api/programs-queries';

export const revalidate = 60; // 1 minute

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentStatus?: string; block?: string; source?: string }>;
}

async function ProgramDataLoader({
  programId,
  filters
}: {
  programId: string;
  filters: Record<string, string | undefined>;
}) {
  const [program, registrations] = await Promise.all([
    getProgram(programId),
    getRegistrationsForProgram(programId, filters),
  ]);

  if (!program) {
    notFound();
  }

  return (
    <ProgramDetailContent
      program={program}
      registrations={registrations}
      currentFilters={filters}
    />
  );
}

export default async function ProgramDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filters = await searchParams;

  return (
    <Suspense fallback={<ProgramDetailSkeleton />}>
      <ProgramDataLoader programId={id} filters={filters} />
    </Suspense>
  );
}
```

### Roster Table with Block Checkmarks
```typescript
// Extend existing registrations-table.tsx pattern
'use client';

import { Check, X, User, Building2, CreditCard } from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { RegistrationSummary } from '@/lib/api/programs-queries';

interface RegistrationsRosterProps {
  registrations: RegistrationSummary[];
  blocks: { id: string; shortName: string }[];
  onRowClick: (registration: RegistrationSummary) => void;
}

const paymentStatusVariant: Record<string, 'healthy' | 'warning' | 'critical'> = {
  Paid: 'healthy',
  Pending: 'warning',
  Refunded: 'critical',
  'Past Due': 'critical',
};

export function RegistrationsRoster({ registrations, blocks, onRowClick }: RegistrationsRosterProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border bg-muted/30">
          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Name</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Company</th>
          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
          {blocks.map((block) => (
            <th key={block.id} className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
              {block.shortName}
            </th>
          ))}
          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Payment</th>
        </tr>
      </thead>
      <tbody>
        {registrations.map((reg) => (
          <tr
            key={reg.id}
            className="border-b border-border/50 hover:bg-muted/50 cursor-pointer"
            onClick={() => onRowClick(reg)}
          >
            <td className="px-4 py-3">
              <div className="font-medium">{reg.full_name}</div>
              <div className="text-xs text-muted-foreground">{reg.job_title}</div>
            </td>
            <td className="px-4 py-3 text-sm">{reg.company_name || '-'}</td>
            <td className="px-4 py-3 text-sm">{reg.email}</td>
            {blocks.map((block) => (
              <td key={block.id} className="px-4 py-3 text-center">
                {isBlockSelected(reg.selected_blocks, block.id) ? (
                  <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                )}
              </td>
            ))}
            <td className="px-4 py-3">
              <Badge variant={paymentStatusVariant[reg.payment_status] || 'secondary'}>
                {reg.payment_status}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function isBlockSelected(selectedBlocks: string[] | null, blockId: string): boolean {
  if (!selectedBlocks) return false;
  if (selectedBlocks.includes('Full') || selectedBlocks.includes('full')) return true;
  return selectedBlocks.some(b => b.toLowerCase().includes(blockId.toLowerCase()));
}
```

### Certificate Progress Section (Virtual Blocks)
```typescript
// For virtual certificate programs
interface CertificateProgressProps {
  parentProgram: {
    id: string;
    instance_name: string;
    child_blocks: {
      id: string;
      name: string;
      start_date: string;
    }[];
  };
  registrantEmail: string;
  completedBlocks: string[];
}

export function CertificateProgress({ parentProgram, registrantEmail, completedBlocks }: CertificateProgressProps) {
  const totalBlocks = parentProgram.child_blocks.length;
  const completed = completedBlocks.length;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-medium mb-2">Certificate Progress</h4>
      <p className="text-sm text-muted-foreground mb-3">
        {completed}/{totalBlocks} blocks completed for {parentProgram.instance_name}
      </p>
      <div className="space-y-2">
        {parentProgram.child_blocks.map((block) => {
          const isCompleted = completedBlocks.includes(block.id);
          return (
            <div key={block.id} className="flex items-center gap-2 text-sm">
              {isCompleted ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/30" />
              )}
              <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                {block.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDateShort(block.start_date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate enrichment service | Inline Apollo API call | Standard | Simpler architecture |
| Custom tabs | Radix UI Tabs | Codebase standard | Accessibility built-in |
| Filter state in useState | URL searchParams | Codebase standard | Shareable, persistent |
| Modals for details | Sheet/slide-out panels | UX standard | Stay in context |

**Deprecated/outdated:**
- `useState` for filter state: Use URL params via `useSearchParams`
- Custom modal dialogs for detail views: Use Sheet for side panels

## Existing Schema Analysis

### Registrations Table (from migrations_archive/20260116_create_registrations_schema.sql)
All required fields EXIST:
```sql
registrations (
  id UUID PRIMARY KEY,
  program_instance_id UUID (FK),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  company_name TEXT,
  registration_date TIMESTAMPTZ,
  registration_source TEXT,       -- 'Website', 'Phone', 'Email', etc.
  registration_status TEXT,       -- 'Confirmed', 'Cancelled', 'Transferred'
  payment_status TEXT,            -- 'Pending', 'Paid', 'Refunded'
  payment_method TEXT,
  final_price DECIMAL,
  attendance_type TEXT,           -- 'Full' or 'Partial'
  selected_blocks TEXT[],         -- Array of block names
)
```

### Registration Source Options (from AUTONOMOUS-BUILD-GUIDE)
```
Website | Phone | Email | Colleague Outreach | Repeat Customer | Referral
```

### Registration Dashboard Summary View (EXISTS)
```sql
CREATE OR REPLACE VIEW registration_dashboard_summary AS
SELECT
  r.id, r.first_name, r.last_name, r.first_name || ' ' || r.last_name as full_name,
  r.email, r.phone, r.company_name, r.job_title,
  r.registration_date, r.registration_status, r.payment_status,
  r.final_price, r.attendance_type, r.selected_blocks,
  pi.id as program_instance_id, pi.instance_name, pi.program_name,
  pi.format, pi.start_date, pi.end_date, pi.city, pi.state
FROM registrations r
LEFT JOIN program_instances pi ON pi.id = r.program_instance_id
```

### Contacts Table (from 002_campaign_tracking_tables.sql)
Exists with Apollo-compatible fields:
```sql
contacts (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  email_status TEXT,           -- For Apollo verification status
  email_validated_at TIMESTAMPTZ,
  lifecycle_stage TEXT,
)
```

### Companies Table (from 001_core_foundation_tables.sql)
Exists with fields matching Apollo response:
```sql
companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  employee_count INTEGER,
  hq_city TEXT, hq_state TEXT,
  linkedin_url TEXT,
)
```

### Schema Additions NEEDED for Phase 2

**1. Extend registrations with cancellation tracking:**
```sql
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_status TEXT,  -- 'not_applicable', 'pending', 'processed', 'denied'
  refund_amount DECIMAL(10,2);
```

**2. Add Apollo enrichment tracking to contacts:**
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS
  apollo_person_id TEXT,
  apollo_enriched_at TIMESTAMPTZ,
  apollo_enrichment_data JSONB DEFAULT '{}',
  photo_url TEXT;
```

**3. Add Apollo enrichment tracking to companies:**
```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS
  apollo_org_id TEXT,
  apollo_enriched_at TIMESTAMPTZ,
  growth_30d NUMERIC(5,2),
  growth_60d NUMERIC(5,2),
  growth_90d NUMERIC(5,2),
  technologies TEXT[];
```

## Apollo API Integration

### People Enrichment Endpoint
**URL:** `POST https://api.apollo.io/api/v1/people/match`
**Rate Limit:** 600 requests/hour

**Required Headers:**
```
Content-Type: application/json
X-Api-Key: {APOLLO_API_KEY}
```

**Request Parameters:**
- `email` (recommended) - Most reliable match
- `first_name`, `last_name` - Combined with domain
- `domain` - Company domain for matching
- `reveal_phone_number: true` - To get phone

**Response Fields (key ones):**
- `person.id`, `person.title`, `person.headline`
- `person.email`, `person.email_status` (verified/unverified)
- `person.linkedin_url`, `person.photo_url`
- `person.organization.name`, `person.organization.industry`
- `person.organization.estimated_num_employees`

### Organization Enrichment Endpoint
**URL:** `GET https://api.apollo.io/api/v1/organizations/enrich`
**Parameters:** `domain` (company domain)

**Response Fields (key ones):**
- `organization.industry`
- `organization.estimated_num_employees`
- `organization.annual_revenue`
- `organization.total_funding`
- `organization.linkedin_url`

### Enrichment Trigger Strategy
Per AUTONOMOUS-BUILD-GUIDE: **Auto on registration**
```typescript
// In registration webhook or form handler:
async function handleNewRegistration(registration: Registration) {
  // 1. Save registration to Supabase
  const saved = await saveRegistration(registration);

  // 2. Find or create contact
  const contact = await findOrCreateContact(registration.email);

  // 3. Trigger Apollo enrichment (async, don't block)
  enrichContactWithApollo(registration.email).then(result => {
    if (result) {
      updateContactWithEnrichment(contact.id, result);
    }
  });

  return saved;
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Sheet component installation**
   - What we know: shadcn Sheet component uses @radix-ui/react-dialog (already installed)
   - What's unclear: Whether to install via shadcn CLI or copy component manually
   - Recommendation: Use `pnpm dlx shadcn@latest add sheet` for consistency

2. **Block name mapping to selected_blocks array**
   - What we know: `selected_blocks` stores TEXT[] like `["Comprehensive Labor Relations"]`
   - What's unclear: Exact matching logic (case sensitive? partial match?)
   - Recommendation: Normalize block names on write, use case-insensitive contains

3. **Virtual certificate cross-block querying**
   - What we know: Virtual blocks linked via `parent_program_id`
   - What's unclear: Query pattern to aggregate registrations across all child blocks
   - Recommendation: Create view `certificate_progress_summary` joining parent + children

## Sources

### Primary (HIGH confidence)
- `dashboard/src/app/dashboard/programs/` - Phase 1 implementation
- `dashboard/src/lib/api/programs-queries.ts` - Existing query patterns
- `dashboard/src/components/ui/tabs.tsx` - Radix Tabs wrapper
- `dashboard/src/app/dashboard/lead-intelligence/contacts/[id]/contact-profile-content.tsx` - Tabs pattern
- `supabase/migrations_archive/20260116_create_registrations_schema.sql` - Registration schema
- `supabase/migrations/001_core_foundation_tables.sql` - Companies schema

### Secondary (MEDIUM confidence)
- [Apollo People Enrichment API](https://docs.apollo.io/reference/people-enrichment) - Official docs
- [Apollo Organization Enrichment API](https://docs.apollo.io/reference/organization-enrichment) - Official docs
- [shadcn/ui Sheet Component](https://ui.shadcn.com/docs/components/radix/sheet) - Official docs

### Tertiary (LOW confidence)
- None - all findings verified from codebase or official docs

## Metadata

**Confidence breakdown:**
- Existing patterns: HIGH - Verified from Phase 1 implementation
- Schema: HIGH - Verified from migration files
- Tab implementation: HIGH - Existing pattern in lead-intelligence
- Apollo integration: MEDIUM - Existing pattern for credits, need to add enrichment
- Sheet component: MEDIUM - Not installed yet, but pattern is standard

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (stable codebase patterns)
