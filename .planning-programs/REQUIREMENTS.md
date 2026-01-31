# Requirements: Programs v1.0

**Defined:** 2026-01-30
**Core Value:** Complete visibility into program logistics, registrations, payments, attendance, and evaluations — all in one place.

## Requirements

### Programs List

- [x] **PROG-01**: Display all programs (upcoming and archived) in a filterable list
- [x] **PROG-02**: Show program name, city/virtual, dates, days until program (or "Completed" badge)
- [x] **PROG-03**: Display status badges for key logistics (instructor, hotel, materials) using color coding (green complete, yellow pending, red missing)
- [x] **PROG-04**: Show registration count per program
- [x] **PROG-05**: Filter by city, program type, status (upcoming/completed), and date range
- [x] **PROG-06**: Sort by date (default), name, or registration count
- [x] **PROG-07**: Virtual blocks display as separate events with link to parent certificate
- [x] **PROG-08**: Virtual certificate shows rollup of registration counts across blocks
- [x] **PROG-09**: Archive toggle to show/hide completed programs

### Program Detail: Registrations Tab

- [x] **PROG-10**: Display registrations tab as the default/first tab
- [x] **PROG-11**: Show roster table with: Name, Company, Email, Blocks attending (checkmarks), Paid status
- [x] **PROG-12**: For block-based programs, show block columns with check/x for each registrant
- [x] **PROG-13**: Indicate registration type: full program vs. individual blocks
- [x] **PROG-14**: For virtual certificates, flag "Certificate registrant" vs. "Block-only registrant"
- [x] **PROG-15**: Show registration source (Website, Phone, Email, Colleague outreach, Repeat customer, Referral)
- [x] **PROG-16**: Filter roster by: paid/unpaid, block attending, company, registration source
- [x] **PROG-17**: Click on registrant row opens Contact Panel (slide-out)
- [x] **PROG-18**: Handle cancellations with visual indicator and refund status
- [x] **PROG-19**: For virtual blocks, show "Certificate Progress" section (who needs which blocks)

### Contact Panel (Slide-Out)

- [x] **PROG-20**: Display enriched person data: name, title, company, email, phone, LinkedIn URL (clickable), profile photo (from LinkedIn)
- [x] **PROG-21**: Show registration details: program, blocks selected, registration date, source
- [x] **PROG-22**: Show payment details: invoice sent date, due date, paid/unpaid status, days until/past due
- [x] **PROG-23**: Display enriched company data: name, industry, employee count, growth rate (30/60/90 day)
- [x] **PROG-24**: Show count of other registrants from same company
- [x] **PROG-25**: "Trigger Colleague Outreach" button that fires n8n workflow
- [x] **PROG-26**: Display workflow status: Not started, Triggered (date), emails sent count
- [x] **PROG-27**: Show engagement history section (expandable)
- [x] **PROG-28**: Email engagement: count received, opened, clicked; which campaigns/sequences
- [x] **PROG-29**: Website behavior: page visits, time on site, last visit date (from GA4)
- [x] **PROG-30**: Conversion attribution: which email/touchpoint preceded registration
- [x] **PROG-31**: Email source: where email was found, which service, verification status
- [x] **PROG-32**: "Enrich" button to trigger Apollo enrichment (if not auto-enriched)

### Program Detail: Logistics Tab

- [ ] **PROG-33**: Display logistics as checklist cards with status indicators
- [ ] **PROG-34**: Instructor assignment card: assigned instructor(s) per block, contact info, confirmation status
- [ ] **PROG-35**: My hotel card: hotel name, dates, confirmation number
- [ ] **PROG-36**: Instructor hotel card: hotel name, dates, confirmation number (per instructor if multiple)
- [ ] **PROG-37**: Room block card: hotel, number of rooms, cut-off date, rooms booked vs. block size
- [ ] **PROG-38**: Venue card: location (same as hotel), daily rental rate, F&B minimum
- [ ] **PROG-39**: BEO card: upload document, status (draft/final), view/download link
- [ ] **PROG-40**: Materials workflow checklist:
  - [ ] Instructor assigned
  - [ ] Materials sent to instructor for review
  - [ ] Instructor feedback received
  - [ ] Updates made (if needed)
  - [ ] Sent to print
  - [ ] Printed
  - [ ] Shipped (with tracking number field)
- [ ] **PROG-41**: AV equipment card: purchased status, shipped status, tracking number
- [ ] **PROG-42**: Expenses section (post-program): itemized expenses with totals
- [ ] **PROG-43**: Each logistics card is expandable to show/edit details
- [ ] **PROG-44**: Virtual programs: hide hotel/venue cards, show only applicable logistics

### Program Detail: Attendance/Evaluations Tab

- [ ] **PROG-45**: Show same roster as Registrations tab with "Actually Attended" checkmarks per block
- [ ] **PROG-46**: Visual distinction between "registered for" vs. "attended"
- [ ] **PROG-47**: Evaluation responses section: display submitted evaluations
- [ ] **PROG-48**: Evaluation survey: standard questions stored in Supabase (template TBD)
- [ ] **PROG-49**: Evaluation customization: instructor name and venue name inserted per program
- [ ] **PROG-50**: Show individual evaluation responses (expandable per attendee)
- [ ] **PROG-51**: Show aggregate evaluation scores (average ratings)
- [ ] **PROG-52**: For virtual certificates, track attendance across linked block events

### Program Status & Logistics Readiness

- [ ] **PROG-53**: Display program status badge (GO/CLOSE/NEEDS) based on registration count
- [ ] **PROG-54**: GO status when 6+ full registrations
- [ ] **PROG-55**: CLOSE status when 4-5 registrations
- [ ] **PROG-56**: NEEDS REGISTRATIONS status when 0-3 registrations
- [ ] **PROG-57**: Display logistics readiness as "X/Y items - Z warnings" format
- [ ] **PROG-58**: In-person programs track 10 logistics items
- [ ] **PROG-59**: Virtual programs track 6 logistics items (no hotel/venue/AV)
- [ ] **PROG-60**: Generate alerts based on days-until-program thresholds:
  - No instructor: warning <=45 days, critical <=30 days
  - Hotel/room block/venue: warning <=90 days, critical <=60 days
  - BEO not received: warning <=10 days, critical <=7 days
  - Materials not sent to instructor: warning <=45 days, critical <=30 days
  - Materials not printed: warning <=14 days, critical <=7 days
  - Materials not shipped: warning <=10 days, critical <=5 days
  - AV not shipped: warning <=10 days, critical <=5 days
  - Below 6 registrations: warning <=45 days, critical <=30 days
  - Unpaid invoices: warning at due date, critical 14+ days past due

### AI Reporting Chat

- [ ] **PROG-61**: Chat interface to query program data in natural language
- [ ] **PROG-62**: Support queries like: "Compare Austin ERL 2025 vs 2024", "Which companies sent the most attendees?", "Average revenue per program by city"
- [ ] **PROG-63**: Display results as tables or simple charts
- [ ] **PROG-64**: Query archived programs as well as upcoming

### Data & Integration

- [x] **PROG-65**: Apollo API integration for person and company enrichment (auto on registration)
- [x] **PROG-66**: GA4 integration for website behavior data
- [x] **PROG-67**: SmartLead API integration for cold email engagement data
- [x] **PROG-68**: GoHighLevel API integration for warm email engagement data
- [x] **PROG-69**: n8n webhook trigger for colleague outreach workflow
- [ ] **PROG-70**: All program data stored in Supabase with proper relational structure

## Out of Scope (This Version)

- Faculty scheduling system — Separate initiative
- Building/editing n8n workflows — Only triggering
- Payment processing — Tracking only
- Certificate PDF generation — Tracking completion only
- Email sequence creation — Read-only engagement data
- Custom report builder UI — AI chat covers this
- Complex role-based permissions — CEO views, admin edits

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROG-01 to PROG-09 | Phase 1: Foundation & Programs List | Complete |
| PROG-10 to PROG-19 | Phase 2: Registrations Tab | Complete |
| PROG-20 to PROG-32 | Phase 3: Contact Panel | Complete |
| PROG-33 to PROG-44 | Phase 4: Logistics Tab | Pending |
| PROG-45 to PROG-52 | Phase 5: Attendance/Evaluations Tab | Pending |
| PROG-53 to PROG-60 | Phase 6: Program Status & Alerts | Pending |
| PROG-61 to PROG-64 | Phase 7: AI Reporting Chat | Pending |
| PROG-65 to PROG-69 | Phase 3: Contact Panel (integrations) | Complete |
| PROG-70 | Phase 1: Foundation | Complete |

**Coverage:**
- Total requirements: 70
- Mapped to phases: 70
- Unmapped: 0

---
*Created: 2026-01-30*
