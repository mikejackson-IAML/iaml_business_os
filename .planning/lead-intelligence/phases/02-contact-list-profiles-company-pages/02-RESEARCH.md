# Phase 2: Contact List, Profiles & Company Pages - Research

**Researched:** 2026-01-27
**Domain:** Next.js 16 dashboard UI — list views, detail pages, tabs, filtering
**Confidence:** HIGH

## Summary

Phase 2 builds the complete read experience for lead intelligence: a paginated contact list with filters and data health metrics, contact profile pages with 6 tabs, and company profile pages with 3 tabs. The existing codebase already has Phase 1 API endpoints (contacts/companies CRUD), a `DataTable` component with pagination/sorting, Radix UI Tabs, and established page patterns (server component with Suspense wrapping async data loader).

The codebase uses Next.js 16 with React 19, Tailwind CSS, Radix UI primitives, Lucide icons, and Supabase. No additional libraries are needed — everything required exists in the stack.

**Primary recommendation:** Follow existing dashboard patterns exactly. Use server components for data loading, `DataTable` for the contact list, Radix Tabs for profile pages, and Next.js dynamic routes (`[id]`) for detail pages. Extend the existing contacts query layer to support filtering.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.1 | App Router, dynamic routes, server components | Already the framework |
| React | 19.2.3 | UI rendering | Already installed |
| @radix-ui/react-tabs | 1.1.13 | Tab components for profile pages | Already installed, used in dashboard-kit |
| @radix-ui/react-dropdown-menu | 2.1.16 | Row actions menu (three-dot) | Already installed |
| @supabase/supabase-js | 2.90.1 | Database queries | Already installed |
| lucide-react | 0.562.0 | Icons | Already installed |
| Tailwind CSS | 3.4.19 | Styling | Already installed |

### No New Dependencies Needed

Everything required is already in the stack. The DataTable component handles pagination/sorting. Radix handles tabs and dropdowns. Supabase handles queries with filtering.

## Architecture Patterns

### Project Structure
```
dashboard/src/app/dashboard/lead-intelligence/
├── page.tsx                           # Contact list (server component + Suspense)
├── lead-intelligence-content.tsx      # Client component: list + metrics + data health
├── lead-intelligence-skeleton.tsx     # Loading skeleton
├── components/
│   ├── contact-table.tsx              # Contact list table wrapper
│   ├── metrics-bar.tsx                # Top metrics bar (LIST-06)
│   ├── data-health-section.tsx        # Collapsible data health (LIST-07, LIST-08)
│   ├── contact-filters.tsx            # Advanced filter panel (LIST-04)
│   ├── contact-row-actions.tsx        # Three-dot dropdown menu (LIST-09)
│   └── contact-avatar.tsx             # Avatar with fallback logic (INT-04)
├── contacts/
│   └── [id]/
│       ├── page.tsx                   # Contact profile (server component)
│       ├── contact-profile-content.tsx # Client component with tabs
│       ├── contact-profile-skeleton.tsx
│       └── tabs/
│           ├── overview-tab.tsx        # PROF-03, PROF-04, PROF-05
│           ├── attendance-tab.tsx      # PROF-06
│           ├── email-campaigns-tab.tsx # PROF-07
│           ├── company-tab.tsx         # PROF-08
│           ├── notes-tab.tsx           # PROF-09
│           └── enrichment-tab.tsx      # PROF-10
└── companies/
    └── [id]/
        ├── page.tsx                    # Company profile (server component)
        ├── company-profile-content.tsx  # Client component with tabs
        ├── company-profile-skeleton.tsx
        └── tabs/
            ├── contacts-tab.tsx        # COMP-03
            ├── notes-tab.tsx           # COMP-05
            └── enrichment-tab.tsx      # COMP-06

dashboard/src/lib/api/
├── lead-intelligence-contacts-queries.ts  # EXTEND: add filter params
├── lead-intelligence-contacts-types.ts    # EXTEND: add filter types
├── lead-intelligence-data-health-queries.ts  # NEW: query data_health_metrics view
├── lead-intelligence-attendance-queries.ts   # NEW: attendance by contact
├── lead-intelligence-email-queries.ts        # NEW: email activities by contact
├── lead-intelligence-notes-queries.ts        # NEW: notes CRUD
├── lead-intelligence-followups-queries.ts    # NEW: follow-ups by contact
├── lead-intelligence-activity-queries.ts     # NEW: activity log by contact

dashboard/src/app/api/lead-intelligence/
├── data-health/
│   └── route.ts                       # GET data health metrics (API-06)
├── contacts/
│   └── [id]/
│       ├── attendance/route.ts        # GET attendance records
│       ├── email-activities/route.ts  # GET email activities
│       ├── notes/route.ts             # GET/POST notes
│       ├── follow-ups/route.ts        # GET follow-ups
│       └── activity/route.ts          # GET activity log
└── companies/
    └── [id]/
        ├── contacts/route.ts          # GET contacts at company
        └── notes/route.ts             # GET/POST company notes
```

### Pattern 1: Page Structure (follow existing leads/page.tsx)
**What:** Server component with Suspense boundary, data loader, client content
**When to use:** Every page
```typescript
// page.tsx
import { Suspense } from 'react';
import { LeadIntelligenceSkeleton } from './lead-intelligence-skeleton';
import { LeadIntelligenceContent } from './lead-intelligence-content';

export const revalidate = 300;

async function DataLoader() {
  // Fetch data server-side
  const [contacts, metrics] = await Promise.all([
    getContacts({ page: 1, limit: 25 }),
    getDataHealthMetrics(),
  ]);
  return <LeadIntelligenceContent contacts={contacts} metrics={metrics} />;
}

export default function Page() {
  return (
    <Suspense fallback={<LeadIntelligenceSkeleton />}>
      <DataLoader />
    </Suspense>
  );
}
```

### Pattern 2: Client-Side Filtering with URL Search Params
**What:** Filters stored in URL search params, client fetches via API on filter change
**When to use:** Contact list with advanced filters
```typescript
'use client';
import { useSearchParams, useRouter } from 'next/navigation';

// Filters modify URL params -> triggers client-side fetch to API
// This allows data health metric links to set filters via URL params
function applyFilter(key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString());
  params.set(key, value);
  params.set('page', '1'); // Reset to page 1
  router.push(`?${params.toString()}`);
}
```

### Pattern 3: Dynamic Route Detail Pages
**What:** Next.js [id] dynamic routes for contact/company profiles
**When to use:** Contact profile, company profile
```typescript
// contacts/[id]/page.tsx
import { getContactById } from '@/lib/api/lead-intelligence-contacts-queries';
import { notFound } from 'next/navigation';

export default async function ContactProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();
  return <ContactProfileContent contact={contact} />;
}
```

### Pattern 4: Tab Content with Lazy Loading
**What:** Radix Tabs with data fetched per-tab on client
**When to use:** Profile pages with 6 tabs (avoid loading all data upfront)
```typescript
// Profile tabs fetch their own data when activated
const [activeTab, setActiveTab] = useState('overview');
const [tabData, setTabData] = useState<Record<string, unknown>>({});

// Fetch tab data on first activation
useEffect(() => {
  if (activeTab && !tabData[activeTab]) {
    fetchTabData(activeTab, contactId).then(data => {
      setTabData(prev => ({ ...prev, [activeTab]: data }));
    });
  }
}, [activeTab]);
```

### Pattern 5: Avatar with Tiered Fallback (INT-04)
**What:** Profile image with 3-tier fallback
**When to use:** Contact avatars everywhere
```typescript
function ContactAvatar({ contact }: { contact: Contact }) {
  const [imgError, setImgError] = useState(false);

  // Tier 1: Supabase storage (customers)
  // Tier 2: LinkedIn CDN proxied through backend
  // Tier 3: Initials in colored circle
  const imageUrl = contact.profile_image_url;
  const initials = `${contact.first_name?.[0] ?? ''}${contact.last_name?.[0] ?? ''}`;

  if (!imageUrl || imgError) {
    return <div className="avatar-initials">{initials}</div>;
  }
  return <img src={imageUrl} onError={() => setImgError(true)} alt={initials} />;
}
```

### Anti-Patterns to Avoid
- **Loading all tab data on profile page load:** Fetch only overview tab initially; lazy-load other tabs
- **Storing filter state only in React state:** Use URL search params so data health links work and filters are shareable
- **Building a custom table component:** Use the existing `DataTable` from dashboard-kit
- **Adding filter logic client-side:** Filter in Supabase queries server-side for performance with large datasets

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Paginated table | Custom table with pagination | `DataTable` from `dashboard-kit/components/dashboard/data-table.tsx` | Already has sorting, pagination, search, export |
| Tab UI | Custom tab implementation | `Tabs` from `dashboard-kit/components/ui/tabs.tsx` (Radix) | Accessible, keyboard nav, already styled |
| Dropdown menus | Custom popover for row actions | `@radix-ui/react-dropdown-menu` | Already installed, accessible |
| Status badges | Custom colored spans | `Badge` from `dashboard-kit/components/ui/badge.tsx` | Consistent styling |
| Metric cards | Custom stat displays | `MetricCard` from `dashboard-kit/components/dashboard/metric-card.tsx` | Established pattern |
| Loading skeletons | Custom loading states | `Skeleton` from `dashboard-kit/components/ui/skeleton.tsx` | Consistent with rest of dashboard |
| Date formatting | Custom date logic | `formatDate`/`formatDateShort` from `dashboard-kit/lib/utils` | Already exists |

## Common Pitfalls

### Pitfall 1: Next.js 16 Params Are Async
**What goes wrong:** Destructuring `params` directly causes build errors in Next.js 15+
**Why it happens:** Next.js 15+ changed dynamic route params to be async (Promise)
**How to avoid:** Always `await params` before accessing properties
**Warning signs:** Build error mentioning params type mismatch

### Pitfall 2: Supabase Type Mismatch with New Tables
**What goes wrong:** TypeScript errors when querying tables not in generated Database type
**Why it happens:** Supabase types haven't been regenerated since Phase 1 added tables
**How to avoid:** Use `as any` cast on `.from()` as established in Phase 1 decision (supabase-any-cast)
**Warning signs:** Type errors on `.from('table_name')`

### Pitfall 3: Data Health Links Must Set URL Params
**What goes wrong:** Clicking data health metric doesn't filter the table
**Why it happens:** Filter state stored in React state instead of URL search params
**How to avoid:** All filters must be URL-param driven so data health section can link with query strings
**Warning signs:** Filters work via UI but data health links don't work

### Pitfall 4: LinkedIn CDN Image Expiry
**What goes wrong:** LinkedIn profile photos return 403 after time
**Why it happens:** LinkedIn CDN URLs expire
**How to avoid:** Decision says proxy through backend and cache. For Phase 2, use `onError` fallback to initials. Full proxy can be a separate API route.
**Warning signs:** Broken images appearing after some time

### Pitfall 5: N+1 Queries on Contact List
**What goes wrong:** Fetching company name for each contact individually
**Why it happens:** Not using Supabase join syntax
**How to avoid:** Existing query already uses `select('*, companies(id, name)')` — maintain this pattern for all list queries

## Code Examples

### Extending ContactListParams for Filtering
```typescript
// Add to lead-intelligence-contacts-types.ts
export interface ContactListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  // Filters (LIST-04)
  status?: string;
  state?: string;
  company_id?: string;
  title?: string;
  department?: string;
  seniority_level?: string;
  email_status?: string;
  is_vip?: boolean;
  engagement_score_min?: number;
  engagement_score_max?: number;
  created_after?: string;
  created_before?: string;
  search?: string; // simple text search on name/email
}
```

### Supabase Query with Filters
```typescript
export async function getContacts(params: ContactListParams): Promise<ContactListResponse> {
  let query = getContactsTable()
    .select('*, companies(id, name)', { count: 'exact' });

  // Apply filters
  if (params.status) query = query.eq('status', params.status);
  if (params.state) query = query.eq('state', params.state);
  if (params.company_id) query = query.eq('company_id', params.company_id);
  if (params.department) query = query.eq('department', params.department);
  if (params.seniority_level) query = query.eq('seniority_level', params.seniority_level);
  if (params.email_status) query = query.eq('email_status', params.email_status);
  if (params.is_vip !== undefined) query = query.eq('is_vip', params.is_vip);
  if (params.engagement_score_min !== undefined) query = query.gte('engagement_score', params.engagement_score_min);
  if (params.engagement_score_max !== undefined) query = query.lte('engagement_score', params.engagement_score_max);
  if (params.search) query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);

  // Pagination + sorting
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  query = query
    .order(params.sort ?? 'created_at', { ascending: (params.order ?? 'desc') === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  // ...
}
```

### Data Health API Route
```typescript
// app/api/lead-intelligence/data-health/route.ts
export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { data, error } = await getServerClient()
    .from('data_health_metrics' as any)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
```

### Breadcrumb Pattern
```typescript
function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">{item.label}</Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` sync access | `await params` then access | Next.js 15 | Must await in all dynamic routes |
| Pages Router | App Router with server components | Next.js 13+ | Already using App Router |
| Client-side data fetching | Server components + Suspense | Next.js 13+ | Already the pattern in codebase |

## Open Questions

1. **Company size filter** — The requirements mention filtering by company size, but the schema stores `employee_count` as integer. Need to define size buckets (e.g., 1-10, 11-50, 51-200, 201-500, 500+) for the filter UI.
   - Recommendation: Define buckets in a constants file, filter with range queries.

2. **Program filter** — LIST-04 mentions filtering by program. This requires joining through `attendance_records` table.
   - Recommendation: Use Supabase `.in()` with a subquery or an RPC function for this filter.

3. **Notes form POST from client** — Profile pages are client components but notes creation needs server action or API call.
   - Recommendation: Use existing API pattern (POST to `/api/lead-intelligence/contacts/[id]/notes`).

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `dashboard/package.json` — verified all library versions
- Codebase inspection: `dashboard/src/dashboard-kit/` — verified existing components
- Codebase inspection: `dashboard/src/lib/api/lead-intelligence-*` — verified Phase 1 patterns
- Codebase inspection: `supabase/migrations/20260203_*` — verified schema and data_health_metrics view
- Codebase inspection: `dashboard/src/app/dashboard/leads/page.tsx` — verified page pattern

### Secondary (MEDIUM confidence)
- Next.js 16 async params — based on Next.js 15+ known behavior, confirmed by existing code patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json
- Architecture: HIGH — follows established codebase patterns exactly
- Pitfalls: HIGH — derived from Phase 1 accumulated decisions and codebase inspection

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable stack, no fast-moving dependencies)
