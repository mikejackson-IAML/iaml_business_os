# Requirements: Lead Intelligence System

**Defined:** 2026-01-27
**Core Value:** Users can find any contact, understand their full relationship with IAML, and take immediate action.

## v1 Requirements

### Database Schema

- [x] **DB-01**: Contacts table with basic info, professional info, location, classification, enrichment tracking, email health, engagement scores, and LinkedIn metadata
- [x] **DB-02**: Companies table with firmographics, location, and enrichment data
- [x] **DB-03**: Attendance records table linking contacts to programs with ratings and feedback
- [x] **DB-04**: Email activities table tracking campaign sends, opens, clicks, replies, bounces
- [x] **DB-05**: Opportunities table with in-house and individual program stage pipelines
- [x] **DB-06**: Opportunity contacts junction table with roles (decision_maker, influencer, etc.)
- [x] **DB-07**: Opportunity attachments table for proposals and contracts
- [x] **DB-08**: Contact notes table with note types (general, call, meeting, email, system)
- [x] **DB-09**: Company notes table
- [x] **DB-10**: Activity log table with polymorphic entity references
- [x] **DB-11**: Follow-up tasks table with Action Center integration
- [x] **DB-12**: Data health metrics view (email validity, freshness, completeness, quality score)

### Contact List View

- [ ] **LIST-01**: User can view paginated contact list with name, company, title, status, last activity
- [ ] **LIST-02**: User can search contacts using natural language queries via AI search bar
- [ ] **LIST-03**: AI search returns structured filters displayed as removable filter pills
- [ ] **LIST-04**: User can apply advanced filters (status, state, company, title, department, seniority, company size, email status, dates, program, engagement score)
- [ ] **LIST-05**: User can select multiple contacts via checkboxes for bulk actions
- [ ] **LIST-06**: Top metrics bar shows total contacts, customers, companies, data quality score
- [ ] **LIST-07**: Data health expandable section shows email health, freshness, completeness details
- [ ] **LIST-08**: Each data health metric links to filtered view of affected contacts
- [ ] **LIST-09**: Contact row actions menu (view profile, add to campaign, enrich, set follow-up, find colleagues, mark VIP, mark do not contact)

### Contact Profile

- [ ] **PROF-01**: Profile header displays contact info, status badges (lead/customer/VIP), and quick action buttons
- [ ] **PROF-02**: Overview tab shows AI-generated intelligence summary with regenerate button
- [ ] **PROF-03**: Overview tab shows key stats grid (programs attended, avg rating, last attended, engagement score)
- [ ] **PROF-04**: Overview tab shows recent activity timeline (last 10 activities)
- [ ] **PROF-05**: Overview tab shows upcoming follow-ups with quick complete action
- [ ] **PROF-06**: Attendance tab shows sortable table of program attendance with ratings and feedback
- [ ] **PROF-07**: Email & Campaigns tab shows current campaigns, email activity timeline, engagement metrics
- [ ] **PROF-08**: Company tab shows company card, other contacts at company, company-level opportunities
- [ ] **PROF-09**: Notes tab with add note form (type selector) and combined notes/activity timeline with filter toggle
- [ ] **PROF-10**: Enrichment Data tab shows enrichment status, enriched fields table, raw JSON viewer

### Company Profile

- [ ] **COMP-01**: Company header displays logo, firmographics, quick action buttons
- [ ] **COMP-02**: Key metrics bar shows contacts in database, customers, total attendance, active opportunities
- [ ] **COMP-03**: Contacts tab shows table of contacts at company with bulk actions and add contact button
- [ ] **COMP-04**: Opportunities tab shows table of opportunities with create button and detail view
- [ ] **COMP-05**: Notes tab with company-level notes (separate from contact notes)
- [ ] **COMP-06**: Enrichment Data tab shows company enrichment fields

### Opportunities

- [ ] **OPP-01**: Opportunities list view at /dashboard/lead-intelligence/opportunities with filters
- [ ] **OPP-02**: In-house pipeline visualization showing stage counts (lead through won/lost)
- [ ] **OPP-03**: User can create opportunities with type (in-house or individual program)
- [ ] **OPP-04**: User can advance opportunities through stage-specific pipelines
- [ ] **OPP-05**: Opportunity detail view with stage visualization, attached contacts with roles, notes, attachments
- [ ] **OPP-06**: User can upload attachments (proposals, contracts) to opportunities

### AI Features

- [ ] **AI-01**: Natural language search parses queries into structured filter objects via Claude API
- [ ] **AI-02**: Search shows loading state ("Understanding your search...") with animation
- [ ] **AI-03**: Contact intelligence summary generated on first profile view, cached, regeneratable
- [ ] **AI-04**: Summary covers attendance history, satisfaction trends, engagement status, company context, suggested next action

### Integrations

- [ ] **INT-01**: Add to Campaign flow opens modal with active SmartLead campaigns, adds contacts via API
- [ ] **INT-02**: Single contact enrichment triggers best source (PhantomBuster for LinkedIn, Apollo/Clearbit for email)
- [ ] **INT-03**: Enrichment merges results into contact record and updates tracking fields
- [ ] **INT-04**: Profile image handling (Supabase Storage for customers, LinkedIn CDN for leads, initials fallback)
- [ ] **INT-05**: Find Colleagues triggers n8n webhook, displays results modal with select-and-add flow
- [ ] **INT-06**: Follow-up task creation syncs with Business OS Action Center

### Bulk Actions

- [ ] **BULK-01**: Bulk add to campaign for selected contacts
- [ ] **BULK-02**: Bulk enrichment for selected contacts
- [ ] **BULK-03**: Bulk set follow-up for selected contacts

### API Endpoints

- [x] **API-01**: CRUD endpoints for contacts (/api/lead-intelligence/contacts)
- [x] **API-02**: CRUD endpoints for companies (/api/lead-intelligence/companies)
- [ ] **API-03**: CRUD endpoints for opportunities (/api/lead-intelligence/opportunities)
- [ ] **API-04**: AI search endpoint (POST /api/lead-intelligence/ai/parse-search)
- [ ] **API-05**: AI summary endpoint (POST /api/lead-intelligence/ai/generate-summary)
- [ ] **API-06**: Data health endpoint (GET /api/lead-intelligence/data-health)
- [ ] **API-07**: Enrichment endpoints (POST contacts/:id/enrich, companies/:id/enrich)
- [ ] **API-08**: Campaign endpoints (POST contacts/:id/add-to-campaign, bulk/add-to-campaign)
- [ ] **API-09**: Follow-up endpoint (POST contacts/:id/follow-up)
- [ ] **API-10**: Find Colleagues endpoint (POST companies/:id/find-colleagues)
- [ ] **API-11**: Opportunity stage advancement (POST opportunities/:id/advance-stage)
- [ ] **API-12**: Opportunity attachments (POST opportunities/:id/attachments)

## v2 Requirements

### Saved Views & Segments
- **V2-01**: User can save filtered searches as named views for quick access
- **V2-02**: User can share saved views

### Tagging System
- **V2-03**: User can create custom tags and apply to contacts/companies
- **V2-04**: Tags available as filter criteria

### Scoring
- **V2-05**: AI-predicted lead scoring (likelihood to register)
- **V2-06**: Company scoring model (training need likelihood)
- **V2-07**: Account health score (participation, engagement, referrals, ratings)

### Advanced Features
- **V2-08**: Click-to-call from contact profile
- **V2-09**: Website tracking pixel for high-intent page visits
- **V2-10**: Alert system for engagement pattern changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user RLS | Single operator for now |
| Mobile-specific UI | Desktop dashboard module |
| Call recording/transcription | Low priority, complex infrastructure |
| Real-time chat with contacts | Out of product scope |
| Android/iOS contact views | Web dashboard only |
| Deep company intelligence reports | Deferred to v2+ (R10 in PRD) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| DB-04 | Phase 1 | Complete |
| DB-05 | Phase 1 | Complete |
| DB-06 | Phase 1 | Complete |
| DB-07 | Phase 1 | Complete |
| DB-08 | Phase 1 | Complete |
| DB-09 | Phase 1 | Complete |
| DB-10 | Phase 1 | Complete |
| DB-11 | Phase 1 | Complete |
| DB-12 | Phase 1 | Complete |
| LIST-01 | Phase 2 | Pending |
| LIST-02 | Phase 3 | Pending |
| LIST-03 | Phase 3 | Pending |
| LIST-04 | Phase 2 | Pending |
| LIST-05 | Phase 4 | Pending |
| LIST-06 | Phase 2 | Pending |
| LIST-07 | Phase 2 | Pending |
| LIST-08 | Phase 2 | Pending |
| LIST-09 | Phase 2 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 3 | Pending |
| PROF-03 | Phase 2 | Pending |
| PROF-04 | Phase 2 | Pending |
| PROF-05 | Phase 2 | Pending |
| PROF-06 | Phase 2 | Pending |
| PROF-07 | Phase 2 | Pending |
| PROF-08 | Phase 2 | Pending |
| PROF-09 | Phase 2 | Pending |
| PROF-10 | Phase 2 | Pending |
| COMP-01 | Phase 2 | Pending |
| COMP-02 | Phase 2 | Pending |
| COMP-03 | Phase 2 | Pending |
| COMP-04 | Phase 5 | Pending |
| COMP-05 | Phase 2 | Pending |
| COMP-06 | Phase 2 | Pending |
| OPP-01 | Phase 5 | Pending |
| OPP-02 | Phase 5 | Pending |
| OPP-03 | Phase 5 | Pending |
| OPP-04 | Phase 5 | Pending |
| OPP-05 | Phase 5 | Pending |
| OPP-06 | Phase 5 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| INT-01 | Phase 4 | Pending |
| INT-02 | Phase 4 | Pending |
| INT-03 | Phase 4 | Pending |
| INT-04 | Phase 2 | Pending |
| INT-05 | Phase 4 | Pending |
| INT-06 | Phase 4 | Pending |
| BULK-01 | Phase 4 | Pending |
| BULK-02 | Phase 4 | Pending |
| BULK-03 | Phase 4 | Pending |
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 5 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| API-06 | Phase 2 | Pending |
| API-07 | Phase 4 | Pending |
| API-08 | Phase 4 | Pending |
| API-09 | Phase 4 | Pending |
| API-10 | Phase 4 | Pending |
| API-11 | Phase 5 | Pending |
| API-12 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after Phase 1 execution*
