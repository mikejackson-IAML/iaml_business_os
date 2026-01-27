# Lead Intelligence System - Roadmap

## Milestone: v1.0

**Goal:** Replace the existing leads dashboard with a comprehensive CRM module — contacts, companies, opportunities, AI search, and external integrations.

### Overview

5 phases building foundation-up: schema first, then core UI, then AI features, then integrations, then opportunities. Each phase delivers a usable increment.

**Build Order Rationale:**
1. Schema + basic API first — everything depends on the data layer
2. List view + profiles — the core UI that makes contacts usable
3. AI features — search and summaries layer on top of working UI
4. Integrations + bulk actions — external systems and workflow automation
5. Opportunities — most independent feature, builds on contacts + companies

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 1 | Database Schema & Core API | DB-01 through DB-12, API-01, API-02 | 14 |
| 2 | Contact List, Profiles & Company Pages | LIST-01, LIST-04, LIST-06 through LIST-09, PROF-01, PROF-03 through PROF-10, COMP-01 through COMP-03, COMP-05, COMP-06, INT-04, API-06 | 22 |
| 3 | AI Search & Intelligence | LIST-02, LIST-03, PROF-02, AI-01 through AI-04, API-04, API-05 | 8 |
| 4 | Integrations & Bulk Actions | LIST-05, INT-01 through INT-03, INT-05, INT-06, BULK-01 through BULK-03, API-07 through API-10 | 12 |
| 5 | Opportunities Pipeline | COMP-04, OPP-01 through OPP-06, API-03, API-11, API-12 | 10 |

**Total:** 60 requirements across 5 phases (plus 6 polish items)

---

### Phase 1: Database Schema & Core API
**Goal:** All database tables, views, functions, and indexes deployed; basic CRUD API endpoints for contacts and companies operational
**Depends on:** Nothing (first phase)
**Requirements:** DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09, DB-10, DB-11, DB-12, API-01, API-02
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Complete database migration (all tables, views, triggers, indexes)
- [x] 01-02-PLAN.md — Contacts CRUD API (types, validation, queries, mutations, routes)
- [x] 01-03-PLAN.md — Companies CRUD API (types, validation, queries, mutations, routes)

**Success Criteria** (what must be TRUE):
1. All 11 tables + junction table created in Supabase with correct foreign keys and indexes
2. Data health metrics view returns valid calculations
3. GET /api/lead-intelligence/contacts returns paginated results with sorting
4. GET /api/lead-intelligence/companies returns paginated results
5. POST/PUT/DELETE for contacts and companies work correctly

---

### Phase 2: Contact List, Profiles & Company Pages
**Goal:** Users can browse contacts, view full contact profiles with all tabs, and view company profiles — the complete read experience
**Depends on:** Phase 1 (requires database and API)
**Requirements:** LIST-01, LIST-04, LIST-06, LIST-07, LIST-08, LIST-09, PROF-01, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08, PROF-09, PROF-10, COMP-01, COMP-02, COMP-03, COMP-05, COMP-06, INT-04, API-06
**Plans:** 7 plans

Plans:
- [x] 02-01-PLAN.md — API layer: filters, data health endpoint, all sub-resource routes
- [x] 02-02-PLAN.md — Shared UI components: avatar, breadcrumbs, badges, metrics bar, data health section
- [x] 02-03-PLAN.md — Contact list page: table, filters, row actions, metrics integration
- [x] 02-04-PLAN.md — Contact profile: header + Overview, Attendance, Email tabs
- [x] 02-05-PLAN.md — Contact profile: Company, Notes, Enrichment tabs
- [x] 02-06-PLAN.md — Company profile: header, metrics, Contacts/Notes/Enrichment tabs
- [x] 02-07-PLAN.md — Build verification and visual checkpoint

**Success Criteria** (what must be TRUE):
1. /dashboard/lead-intelligence shows paginated contact table with metrics bar and data health section
2. Advanced filters work for all filter types (status, state, company, title, etc.)
3. Clicking a contact navigates to /dashboard/lead-intelligence/contacts/[id] with all 6 tabs rendering data
4. Profile images display correctly (Supabase Storage for customers, LinkedIn CDN for leads, initials fallback)
5. Clicking a company navigates to /dashboard/lead-intelligence/companies/[id] with contacts, notes, and enrichment tabs
6. Data health metrics endpoint returns valid data and expandable section links filter the list

---

### Phase 3: AI Search & Intelligence
**Goal:** Users can search contacts with natural language and view AI-generated intelligence summaries on contact profiles
**Depends on:** Phase 2 (requires contact list and profile UI)
**Requirements:** LIST-02, LIST-03, PROF-02, AI-01, AI-02, AI-03, AI-04, API-04, API-05
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — AI API endpoints, types, Claude helpers, and DB migration for summary caching
- [x] 03-02-PLAN.md — AI search bar with rotating placeholder and removable filter pills
- [x] 03-03-PLAN.md — AI intelligence summary card on contact profile Overview tab

**Success Criteria** (what must be TRUE):
1. User types natural language query and sees "Understanding your search..." loading state
2. AI returns structured filters displayed as removable pills within 2 seconds
3. User can manually adjust/remove individual filter pills
4. Contact profile Overview tab shows AI-generated summary covering attendance, satisfaction, engagement, company context
5. Summary is cached and can be regenerated on demand

---

### Phase 4: Integrations & Bulk Actions
**Goal:** Users can take action at scale — add contacts to SmartLead campaigns, trigger enrichment, find colleagues, set follow-ups
**Depends on:** Phase 2 (requires contact list with selection)
**Requirements:** LIST-05, INT-01, INT-02, INT-03, INT-05, INT-06, BULK-01, BULK-02, BULK-03, API-07, API-08, API-09, API-10

**Success Criteria** (what must be TRUE):
1. User can select multiple contacts and see bulk actions bar
2. Add to Campaign opens modal with SmartLead campaigns and adds contacts via API
3. Single contact enrichment calls Apollo/PhantomBuster and updates record
4. Find Colleagues triggers n8n webhook and displays results modal with select-and-add
5. Follow-up task creation creates record and syncs with Action Center
6. Bulk enrich and bulk set follow-up work for multiple selected contacts

---

### Phase 5: Opportunities Pipeline
**Goal:** Users can create and manage sales opportunities through stage-based pipelines for both in-house training and individual programs
**Depends on:** Phase 1 (schema), Phase 2 (company pages)
**Requirements:** COMP-04, OPP-01, OPP-02, OPP-03, OPP-04, OPP-05, OPP-06, API-03, API-11, API-12

**Success Criteria** (what must be TRUE):
1. /dashboard/lead-intelligence/opportunities shows filterable list of all opportunities
2. In-house pipeline visualization displays stage counts across 9 stages
3. User can create both in-house (company-level) and individual (contact-level) opportunities
4. User can advance opportunities through stage-specific pipelines with stage buttons
5. Opportunity detail view shows stage visualization, attached contacts with roles, notes, and file attachments
6. User can upload attachments (proposals, contracts) stored in Supabase Storage

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Schema & Core API | 3/3 | Complete | 2026-01-27 |
| 2. Contact List, Profiles & Company Pages | 7/7 | Complete | 2026-01-27 |
| 3. AI Search & Intelligence | 3/3 | Complete | 2026-01-27 |
| 4. Integrations & Bulk Actions | 0/? | Not started | - |
| 5. Opportunities Pipeline | 0/? | Not started | - |

---
*Roadmap created: 2026-01-27*
*Last updated: 2026-01-27 after Phase 3 execution*
