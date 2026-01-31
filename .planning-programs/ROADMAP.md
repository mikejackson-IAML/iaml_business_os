# Programs - Roadmap

## Milestone: v1.0

**Goal:** Build a complete program management dashboard with registration tracking, logistics management, attendance/evaluations, and AI-powered reporting.

### Overview

This roadmap builds the Programs section in 7 phases, ordered by technical dependencies. Database and foundation first, then build out each tab, then add status/alerts logic, and finally AI reporting.

**Build Order Rationale:**
1. Foundation first — schema, types, base route structure
2. Programs list before detail — need navigation before drill-down
3. Registrations tab first — primary use case, most used view
4. Contact panel after registrations — depends on roster being built
5. Logistics after registrations — second priority, less frequent access
6. Attendance/Evaluations after logistics — post-program workflow
7. Status & Alerts near end — needs data from all prior phases
8. AI Reporting last — needs all data structures in place

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 1 | Foundation & Programs List | PROG-01 to PROG-09, PROG-70 | 10 |
| 2 | Registrations Tab | PROG-10 to PROG-19, PROG-65 | 11 |
| 3 | Contact Panel | PROG-20 to PROG-32, PROG-66, PROG-67, PROG-68, PROG-69 | 17 |
| 4 | Logistics Tab | PROG-33 to PROG-44 | 12 |
| 5 | Attendance/Evaluations Tab | PROG-45 to PROG-52 | 8 |
| 6 | Program Status & Alerts | PROG-53 to PROG-60 | 8 |
| 7 | AI Reporting Chat | PROG-61 to PROG-64 | 4 |

**Total:** 70 requirements across 7 phases

---

### Phase 1: Foundation & Programs List
**Goal:** Database schema, types, route structure, and programs list view
**Depends on:** Nothing (foundation)
**Requirements:** PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, PROG-07, PROG-08, PROG-09, PROG-70

**Success Criteria:**
1. Supabase schema deployed with programs, registrations, contacts, companies, logistics tables
2. TypeScript types for all entities
3. `/dashboard/programs` route loads with skeleton
4. Programs list displays with all columns (name, city/virtual, dates, countdown/completed)
5. Status badges show logistics indicators (instructor, hotel, materials)
6. Registration count displayed per program
7. Filters work: city, program type, status, date range
8. Sorting works: date, name, registration count
9. Virtual blocks show as separate rows with parent link
10. Virtual certificate shows rollup registration count
11. Archive toggle shows/hides completed programs

**Plans:** 5 plans (including gap closure)

Plans:
- [x] 01-01-PLAN.md — Schema extension (parent_program_id) and query functions
- [x] 01-02-PLAN.md — Route structure, page component, and core UI components
- [x] 01-03-PLAN.md — Filters, archive toggle, and virtual block display
- [x] 01-04-PLAN.md — Date range filter UI (gap closure)
- [x] 01-05-PLAN.md — Virtual block data wiring (gap closure)

---

### Phase 2: Registrations Tab
**Goal:** Registrations roster with filtering and Apollo auto-enrichment
**Depends on:** Phase 1 (schema and programs list)
**Requirements:** PROG-10, PROG-11, PROG-12, PROG-13, PROG-14, PROG-15, PROG-16, PROG-17, PROG-18, PROG-19, PROG-65

**Success Criteria:**
1. Registrations tab is default/first tab on program detail
2. Roster table shows: Name, Company, Email, Block checkmarks, Paid status
3. Block columns show check/x per registrant
4. Registration type indicated (full program vs. blocks)
5. Virtual certificate flag distinguishes "Certificate" vs "Block-only"
6. Registration source displayed
7. Filters work: paid/unpaid, block, company, source
8. Row click triggers Contact Panel (Phase 3)
9. Cancellations show visual indicator with refund status
10. Virtual blocks show "Certificate Progress" section
11. Apollo enrichment triggers automatically on new registration

**Plans:** TBD during planning phase

---

### Phase 3: Contact Panel
**Goal:** Slide-out panel with enriched data and engagement history
**Depends on:** Phase 2 (registrations table)
**Requirements:** PROG-20 to PROG-32, PROG-66, PROG-67, PROG-68, PROG-69

**Success Criteria:**
1. Slide-out panel opens on registrant click (600px+ width)
2. Person data displayed: name, title, company, email, phone, LinkedIn, photo
3. Registration details: program, blocks, date, source
4. Payment details: invoice sent, due date, status, days until/past due
5. Company data: name, industry, size, growth rates
6. Same-company registrant count shown
7. Colleague outreach button (disabled until webhook ready)
8. Workflow status displayed
9. Engagement history section expandable
10. Email engagement: received, opened, clicked, campaigns
11. Website behavior: pages, time, last visit
12. Conversion attribution shown
13. Email source and verification status displayed
14. Manual enrich button available
15. GA4 integration working
16. SmartLead integration working
17. GoHighLevel integration working

**Plans:** TBD during planning phase

---

### Phase 4: Logistics Tab
**Goal:** Logistics checklist with status tracking and expense management
**Depends on:** Phase 1 (schema)
**Requirements:** PROG-33 to PROG-44

**Success Criteria:**
1. Logistics displayed as expandable checklist cards
2. Instructor card: assignments, contact info, confirmation
3. My hotel card: name, dates, confirmation number
4. Instructor hotel card: name, dates, confirmation (per instructor)
5. Room block card: hotel, rooms, cut-off, booked vs. block
6. Venue card: location, rental rate, F&B minimum
7. BEO card: upload, status, view/download
8. Materials checklist: all 7 items trackable
9. AV card: purchased, shipped, tracking
10. Expenses section: itemized with totals
11. All cards expandable for editing
12. Virtual programs hide hotel/venue/AV cards

**Plans:** TBD during planning phase

---

### Phase 5: Attendance/Evaluations Tab
**Goal:** Post-program attendance tracking and evaluation display
**Depends on:** Phase 2 (registrations table structure)
**Requirements:** PROG-45 to PROG-52

**Success Criteria:**
1. Roster shows with "Actually Attended" checkmarks per block
2. Visual distinction between registered and attended
3. Attendance checkboxes save immediately
4. Evaluation responses displayed
5. Standard survey template stored in Supabase
6. Instructor/venue names customized per program
7. Individual responses expandable per attendee
8. Aggregate scores (averages) calculated and displayed
9. Virtual certificates track attendance across linked blocks

**Plans:** TBD during planning phase

---

### Phase 6: Program Status & Alerts
**Goal:** GO/CLOSE/NEEDS status badges and logistics alerts
**Depends on:** Phases 1-5 (needs data from all)
**Requirements:** PROG-53 to PROG-60

**Success Criteria:**
1. Program status badge displays (GO/CLOSE/NEEDS)
2. GO = 6+ registrations (green)
3. CLOSE = 4-5 registrations (yellow)
4. NEEDS = 0-3 registrations (red)
5. Logistics readiness shows "X/Y - Z warnings"
6. In-person tracks 10 items
7. Virtual tracks 6 items
8. All alert thresholds implemented:
   - Instructor: warn <=45d, crit <=30d
   - Hotel/room/venue: warn <=90d, crit <=60d
   - BEO: warn <=10d, crit <=7d
   - Materials sent: warn <=45d, crit <=30d
   - Materials printed: warn <=14d, crit <=7d
   - Materials shipped: warn <=10d, crit <=5d
   - AV: warn <=10d, crit <=5d
   - Registrations: warn <=45d, crit <=30d
   - Unpaid: warn at due, crit 14+ days past

**Plans:** TBD during planning phase

---

### Phase 7: AI Reporting Chat
**Goal:** Natural language interface for program data queries
**Depends on:** All prior phases (needs complete data)
**Requirements:** PROG-61 to PROG-64

**Success Criteria:**
1. Chat interface accessible from programs section
2. Natural language queries work
3. Example queries supported:
   - "Compare Austin ERL 2025 vs 2024"
   - "Which companies sent the most attendees?"
   - "Average revenue per program by city"
4. Results display as tables or charts
5. Archived programs queryable

**Plans:** TBD during planning phase

---

## Progress

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| 1. Foundation & Programs List | 5/5 | Complete |
| 2. Registrations Tab | 0/TBD | Not Started |
| 3. Contact Panel | 0/TBD | Not Started |
| 4. Logistics Tab | 0/TBD | Not Started |
| 5. Attendance/Evaluations Tab | 0/TBD | Not Started |
| 6. Program Status & Alerts | 0/TBD | Not Started |
| 7. AI Reporting Chat | 0/TBD | Not Started |

---
*Roadmap created: 2026-01-30*
*Phase 1 complete: 2026-01-31*
