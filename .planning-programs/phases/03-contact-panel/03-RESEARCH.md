# Phase 3: Contact Panel - Research

**Researched:** 2026-01-31
**Domain:** Slide-out panel UI, API integrations (Apollo, GA4, SmartLead, GHL), n8n webhook triggers
**Confidence:** HIGH (codebase patterns), MEDIUM (external integrations)

## Summary

Phase 3 builds a slide-out Contact Panel that opens when clicking a registrant row. The panel displays enriched person data, registration details, payment status, company information (with historical registrant data), and engagement history from multiple sources (GA4, SmartLead, GoHighLevel).

The codebase uses `@radix-ui/react-dialog` for dialogs but does NOT have a Sheet component installed. A Sheet component (from shadcn/ui) needs to be added for the slide-out pattern. Apollo enrichment API already exists and works. The other integrations (GA4, SmartLead, GHL) require new API routes and service clients.

**Primary recommendation:** Add shadcn/ui Sheet component, build panel with vertical scroll layout, create API routes for each integration with graceful degradation when data is unavailable.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @radix-ui/react-dialog | ^1.1.15 | Dialog primitives | Installed, used by Sheet |
| lucide-react | ^0.562.0 | Icons | Installed |
| framer-motion | ^12.26.1 | Animations | Installed |
| sonner | ^2.0.7 | Toast notifications | Installed |
| @supabase/supabase-js | ^2.90.1 | Database client | Installed |

### To Add
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @radix-ui/react-dialog | (use existing) | Sheet is Dialog + positioning | Sheet extends Dialog |
| @google-analytics/data | latest | GA4 Data API client | Website behavior data |

### Supporting (Existing Patterns)
| Pattern | Location | Purpose |
|---------|----------|---------|
| Apollo enrichment | `/api/apollo/enrich` | Person/company enrichment |
| Workflow triggers | `/lib/api/workflow-triggers.ts` | n8n webhook pattern |
| Server client | `/lib/supabase/server.ts` | Database queries |

**Installation:**
```bash
cd dashboard && npm install @google-analytics/data
```

Note: SmartLead and GHL integrations use REST APIs directly (no SDK needed).

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/dashboard/programs/
│   ├── [id]/
│   │   └── program-detail-content.tsx  # Add Sheet open/close state
│   └── components/
│       ├── contact-panel/
│       │   ├── contact-panel.tsx       # Main Sheet wrapper
│       │   ├── person-hero.tsx         # Photo, name, title section
│       │   ├── registration-section.tsx
│       │   ├── payment-section.tsx
│       │   ├── company-section.tsx
│       │   ├── engagement-section.tsx  # Summary + expandable
│       │   └── colleague-outreach-button.tsx
│       └── registrations-roster.tsx    # Existing, just wire up onClick
├── components/ui/
│   └── sheet.tsx                       # New: shadcn Sheet component
├── lib/api/
│   ├── apollo-enrichment.ts            # Existing
│   ├── ga4-queries.ts                  # New: GA4 Data API
│   ├── smartlead-queries.ts            # New: SmartLead API
│   └── ghl-queries.ts                  # New: GHL API
└── app/api/
    ├── apollo/enrich/route.ts          # Existing
    ├── ga4/user-behavior/route.ts      # New
    ├── smartlead/engagement/route.ts   # New
    ├── ghl/engagement/route.ts         # New
    └── programs/colleague-outreach/route.ts # New: workflow trigger
```

### Pattern 1: Sheet Component for Slide-Out Panel

**What:** Use shadcn/ui Sheet component built on Radix Dialog
**When to use:** All slide-out panels from the right side

**Example (Sheet from shadcn/ui):**
```typescript
// Source: https://ui.shadcn.com/docs/components/sheet
import * as SheetPrimitive from "@radix-ui/react-dialog"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<...>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
    ref={ref}
  />
))

// SheetContent with side="right" for right slide-in
const SheetContent = React.forwardRef<...>(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg",
          side === "right" && "inset-y-0 right-0 h-full w-[600px] border-l",
          // Animation classes
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 ...">
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
)
```

### Pattern 2: Controlled Sheet State

**What:** Parent component controls Sheet open/close state
**When to use:** When trigger is external (row click, not button inside Sheet)

**Example:**
```typescript
// Source: Existing pattern in program-detail-content.tsx
function ProgramDetailContent({ program, registrations }) {
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationRosterItem | null>(null);

  function handleRowClick(registration: RegistrationRosterItem) {
    setSelectedRegistration(registration);
  }

  return (
    <>
      <RegistrationsRoster
        registrations={registrations}
        onRowClick={handleRowClick}
      />

      <Sheet
        open={selectedRegistration !== null}
        onOpenChange={(open) => !open && setSelectedRegistration(null)}
      >
        <SheetContent side="right" className="w-[600px] overflow-y-auto">
          {selectedRegistration && (
            <ContactPanel registration={selectedRegistration} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
```

### Pattern 3: Section Component with Expandable Details

**What:** Summary line + expandable detail list
**When to use:** Engagement history sections per CONTEXT.md decision

**Example:**
```typescript
// Engagement section pattern
function EngagementSection({ title, summary, events, maxVisible = 10 }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className="font-medium">{title}</h4>
        <span className="text-sm text-muted-foreground">{summary}</span>
        <ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
      </div>

      {expanded && (
        <div className="space-y-1 pl-4">
          {events.slice(0, maxVisible).map(event => (
            <div key={event.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{formatDate(event.date)}</span>
              <span>{event.type}</span>
              <span className="text-muted-foreground truncate">{event.subject}</span>
            </div>
          ))}
          {events.length > maxVisible && (
            <Link href={`/contacts/${contactId}/activity`} className="text-sm text-accent">
              View all {events.length} events
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Workflow Trigger via Webhook

**What:** Call n8n webhook URL with POST request
**When to use:** Colleague Outreach button, any workflow trigger

**Example:**
```typescript
// Source: Existing pattern in /lib/api/workflow-triggers.ts
export async function triggerWorkflow(
  workflowId: string,
  webhookUrl: string,
  parameters?: Record<string, unknown>
): Promise<TriggerResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameters || {}),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  // ... handle response
}
```

### Anti-Patterns to Avoid

- **Avoid tabs in panel:** User decided single scroll layout, not tabs
- **Avoid fetching all integrations at once:** Load engagement data lazily on section expand
- **Avoid blocking on missing data:** Show panel immediately with available data, load integrations async
- **Avoid custom scroll handling:** Use CSS `overflow-y-auto` on SheetContent

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-out panel | Custom portal/animation | shadcn Sheet | Focus trap, accessibility, animations handled |
| Dialog backdrop | Custom overlay div | Radix Dialog Overlay | Click-outside, escape key, proper z-index |
| API rate limiting | Custom debounce | API route with cache check | `isRecentlyEnriched()` pattern exists |
| Workflow trigger | Raw fetch with no timeout | `triggerWorkflow()` from workflow-triggers.ts | Timeout handling, error states |
| Loading states | Custom spinners | Skeleton component | `@/components/ui/skeleton.tsx` exists |

**Key insight:** The codebase has established patterns for async operations, loading states, and API integrations. Follow these patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Sheet Width on Mobile
**What goes wrong:** 600px fixed width overflows on mobile
**Why it happens:** Desktop-first implementation
**How to avoid:** Use responsive width classes: `w-full sm:w-[600px]`
**Warning signs:** Panel unusable on phones

### Pitfall 2: Data Loading Race Conditions
**What goes wrong:** Panel shows stale data when rapidly clicking different rows
**Why it happens:** Previous fetch completes after new selection
**How to avoid:** Use registration ID as key, cancel in-flight requests on new selection
**Warning signs:** Wrong contact's data displayed

### Pitfall 3: Integration API Keys Missing
**What goes wrong:** Blank engagement sections, console errors
**Why it happens:** GA4/SmartLead/GHL API keys not configured in production
**How to avoid:** Graceful degradation - show "Not connected" message, not error
**Warning signs:** Works in dev, fails in prod

### Pitfall 4: Company History Query Performance
**What goes wrong:** Slow panel load for large companies
**Why it happens:** Querying all historical registrations without limits
**How to avoid:** Limit to 50 most recent, paginate "View all"
**Warning signs:** Panel takes >2s to open

### Pitfall 5: Apollo Data Missing for New Registrations
**What goes wrong:** Empty person section for unenriched contacts
**Why it happens:** Auto-enrichment trigger may not have run yet
**How to avoid:** Show available registration data, offer manual enrich button prominently
**Warning signs:** Panel looks broken when it's just missing enrichment

## Code Examples

### Fetching Contact with Enrichment Data
```typescript
// Source: Pattern from /lib/api/lead-intelligence-contacts-queries.ts
export async function getContactWithEnrichment(email: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      companies (
        id, name, industry, employee_count,
        growth_30d, growth_60d, growth_90d, technologies
      )
    `)
    .eq('email', email.toLowerCase())
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

### Company History Query (All Programs)
```typescript
// Query to find all registrations from same company
export async function getCompanyRegistrationHistory(companyName: string) {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('registration_dashboard_summary')
    .select('id, full_name, program_name, registration_date, payment_status')
    .eq('company_name', companyName)
    .order('registration_date', { ascending: false })
    .limit(50);

  return data || [];
}
```

### GA4 Data API for Website Behavior
```typescript
// Source: https://googleapis.dev/nodejs/analytics-data/latest/
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function getWebsiteBehavior(email: string) {
  const client = new BetaAnalyticsDataClient();

  const [response] = await client.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'date' },
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'userEngagementDuration' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'userId', // Requires GA4 user ID tracking
        stringFilter: { value: email },
      },
    },
    limit: 10,
  });

  return response.rows || [];
}
```

### SmartLead API for Email Engagement
```typescript
// Source: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
const SMARTLEAD_API = 'https://server.smartlead.ai/api/v1';

export async function getSmartLeadEngagement(email: string) {
  const apiKey = process.env.SMARTLEAD_API_KEY;

  // SmartLead requires campaign ID - need to query campaigns first
  const response = await fetch(
    `${SMARTLEAD_API}/leads/by-email?email=${email}&api_key=${apiKey}`
  );

  const data = await response.json();

  return {
    openCount: data.open_count || 0,
    clickCount: data.click_count || 0,
    replyCount: data.reply_count || 0,
    lastOpenedAt: data.open_time,
    campaigns: data.campaigns || [],
  };
}
```

### GHL API for Warm Email Engagement
```typescript
// Source: https://highlevel.stoplight.io/docs/integrations
const GHL_API = 'https://services.leadconnectorhq.com';

export async function getGHLEngagement(contactId: string) {
  const accessToken = process.env.GHL_ACCESS_TOKEN;

  const response = await fetch(
    `${GHL_API}/conversations/search?contactId=${contactId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
      },
    }
  );

  const data = await response.json();
  return data.conversations || [];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom overlay divs | Radix Dialog/Sheet | 2023+ | Better accessibility, focus management |
| Google Analytics v3 | GA4 Data API | July 2023 | Event-based model, new query syntax |
| GHL API v1 | GHL API v2 | Jan 2026 | v1 end-of-support, use v2 only |

**Deprecated/outdated:**
- Universal Analytics (UA) API: Fully sunset, use GA4 only
- GHL API v1: End-of-life as of Jan 8, 2026

## Integration Requirements Summary

### GA4 (PROG-66)
- **Auth:** Service account JSON credentials
- **Env vars:** `GOOGLE_APPLICATION_CREDENTIALS`, `GA4_PROPERTY_ID`
- **Limitation:** Requires user ID tracking in GA4 setup to query by email
- **Fallback:** Show "Website tracking not configured" if no data

### SmartLead (PROG-67)
- **Auth:** API key as query parameter
- **Env vars:** `SMARTLEAD_API_KEY`
- **Rate limit:** 10 requests per 2 seconds
- **Data available:** Opens, clicks, replies, bounce status, campaign membership

### GoHighLevel (PROG-68)
- **Auth:** OAuth 2.0 access token or Personal Integration Token
- **Env vars:** `GHL_ACCESS_TOKEN`, `GHL_LOCATION_ID`
- **API version:** Use v2 only (v1 is EOL)
- **Data available:** Conversations, messages, email activity

### n8n Webhook (PROG-69)
- **Auth:** Webhook URL includes auth token
- **Pattern:** Fire-and-forget with 10s timeout
- **Requirement:** Workflow must be registered in `workflow_registry` with `webhook_url`

## Open Questions

Things that couldn't be fully resolved:

1. **GA4 User Identification**
   - What we know: GA4 can query by user ID or client ID
   - What's unclear: Is email being tracked as user ID in current GA4 setup?
   - Recommendation: Check GA4 configuration; may need to match by client ID from cookies instead

2. **SmartLead Contact Lookup**
   - What we know: API can search by email
   - What's unclear: Which campaigns to query if contact is in multiple
   - Recommendation: Query all campaigns contact appears in, aggregate metrics

3. **GHL Contact Matching**
   - What we know: GHL uses internal contact IDs
   - What's unclear: How to map email to GHL contact ID
   - Recommendation: Add `ghl_contact_id` column to contacts table, sync via webhook

## Sources

### Primary (HIGH confidence)
- Codebase patterns: `/dashboard/src/lib/api/workflow-triggers.ts`, `/dashboard/src/lib/api/apollo-enrichment.ts`
- Database schema: `/supabase/migrations/20260131_registrations_tab_schema.sql`, `/supabase/migrations/001_core_foundation_tables.sql`
- Existing UI patterns: `/dashboard/src/components/ui/dialog.tsx`, `/dashboard/src/app/dashboard/programs/[id]/program-detail-content.tsx`

### Secondary (MEDIUM confidence)
- [shadcn/ui Sheet documentation](https://ui.shadcn.com/docs/components/sheet)
- [SmartLead API Documentation](https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation)
- [GoHighLevel API Portal](https://marketplace.gohighlevel.com/docs/)
- [GA4 Data API Node.js Client](https://googleapis.dev/nodejs/analytics-data/latest/index.html)

### Tertiary (LOW confidence - validate before use)
- GA4 user ID tracking capability needs verification against actual GA4 property configuration
- GHL contact ID mapping strategy needs validation with current GHL setup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already installed, patterns established
- Architecture: HIGH - Clear patterns from existing codebase
- UI patterns: HIGH - Sheet component well documented, Dialog primitives installed
- Apollo integration: HIGH - Already implemented and working
- GA4 integration: MEDIUM - API documented but user ID tracking needs verification
- SmartLead integration: MEDIUM - API documented, rate limits known
- GHL integration: MEDIUM - API v2 documented, contact mapping unclear
- n8n triggers: HIGH - Existing pattern in workflow-triggers.ts

**Research date:** 2026-01-31
**Valid until:** 30 days (stable technologies, no expected breaking changes)
