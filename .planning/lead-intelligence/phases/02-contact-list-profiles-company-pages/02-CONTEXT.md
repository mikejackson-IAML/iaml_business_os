# Phase 2: Contact List, Profiles & Company Pages - Context

**Project:** Lead Intelligence System
**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse contacts in a paginated list, view full contact profiles with 6 tabs (Overview, Attendance, Email & Campaigns, Company, Notes, Enrichment Data), and view company profiles with contacts, notes, and enrichment. This is the complete read experience — no bulk actions, no AI search, no integrations (those are Phases 3-4).

</domain>

<decisions>
## Implementation Decisions

### Contact list layout
- Comfortable row density with avatar thumbnails — like HubSpot/Salesforce, not spreadsheet-compact
- Default columns: Name, Company, Title, Status, Last Activity (5 columns, essentials only)
- Metrics bar above table, data health in collapsible section below metrics bar
- Row actions: Claude's discretion (three-dot menu or hover-reveal)

### Profile page structure
- Horizontal tab bar below header: Overview, Attendance, Email & Campaigns, Company, Notes, Enrichment Data
- Breadcrumb navigation: Lead Intelligence > Contacts > {Name}
- Profile header style: Claude's discretion (full card vs compact)
- Tab loading strategy: Claude's discretion (lazy vs eager based on data volume)

### Data health section
- Metric presentation style: Claude's discretion (stat cards with progress bars vs simple list with badges)
- Clicking a data health metric filters the existing table on the same page (scroll to table with filter applied)
- Data quality score format: Claude's discretion (percentage vs letter grade)
- Show "Last calculated" timestamp on data health metrics

### Image & identity display
- Avatar fallback style: Claude's discretion (colored circle vs gray circle with initials)
- VIP and status badges: Colored pill badges — 'VIP' in gold, 'Customer' in green, 'Lead' in blue
- Company logos in contact list: Claude's discretion (based on performance/visual weight)
- LinkedIn CDN profile photos: Proxy through backend for reliability (cache on our side, URLs won't expire)

### Claude's Discretion
- Row action pattern (three-dot menu vs hover-reveal)
- Profile header density (full card vs compact bar)
- Tab loading strategy (lazy vs eager)
- Data health metric card style
- Data quality score format (percentage vs letter grade)
- Avatar fallback color scheme
- Company logo placement in contact list vs profile only

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches matching existing dashboard patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-contact-list-profiles-company-pages*
*Context gathered: 2026-01-27*
