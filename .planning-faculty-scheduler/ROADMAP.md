# Roadmap

## Milestone 1: Faculty Program Scheduler MVP

### Phase 1: Foundation & Data Migration
**Status:** ✅ COMPLETE
**Goal:** Establish database schema and migrate existing data from Airtable to Supabase.

**Deliverables:**
- Supabase tables: programs, program_blocks, instructors, claims, instructor_qualifications
- Migration scripts for Airtable → Supabase
- Data validation checks
- Seed data for testing

**Files Created:**
- `supabase/migrations/20260120_create_faculty_scheduler_schema.sql`
- `supabase/scripts/migrate-faculty-qualifications.sql`
- `supabase/scripts/validate-faculty-scheduler.sql`
- `supabase/scripts/seed-faculty-scheduler-test-data.sql`

**Requirements:** D1, D2, D3, D4, M1, M2, M3, M4

**Acceptance Criteria:**
- [ ] All Airtable instructor records exist in Supabase with correct field mapping
- [ ] All Airtable program records exist in Supabase
- [ ] Tier designation field populated for VIP instructors
- [ ] State field populated for all instructors
- [ ] Qualified programs linked to instructors

---

### Phase 2: Tier Engine & Notification System
**Status:** Not Started
**Goal:** Build the automated tier advancement system and email notification infrastructure.

**Deliverables:**
- n8n workflow: tier advancement scheduler (runs daily)
- n8n workflow: notification trigger on tier change
- SendGrid email templates (tier release, confirmation)
- Magic link generation and validation
- Supabase tables: notifications, magic_tokens

**Requirements:** D5, D6, T4, N1, N2, N4, N6, P4, P5

**Acceptance Criteria:**
- [ ] Program released → Tier 0 instructors receive email within 5 minutes
- [ ] After 7 days → Tier 1 instructors automatically notified
- [ ] After 5 more days → Tier 2 instructors automatically notified
- [ ] Magic links correctly identify instructor and don't expire prematurely
- [ ] Confirmation email sent immediately on claim with materials link

---

### Phase 3: Instructor Sign-up Page
**Status:** ✅ COMPLETE
**Goal:** Build the faculty-facing web interface for viewing and claiming programs.

**Deliverables:**
- Next.js app at faculty.iaml.com
- Magic link token validation middleware
- Personalized program list view with filters
- Grouped program/block display with checkboxes
- Multi-select claim flow with confirmation
- Responsive design (mobile-friendly)

**Requirements:** S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, T1, T2, T3, T5, T6

**Acceptance Criteria:**
- [ ] Instructor clicks magic link → lands on personalized page with their name
- [ ] Only programs available to their tier are visible
- [ ] Can filter by program type, date range, state
- [ ] Can select multiple blocks across programs
- [ ] Clicking "Claim Selected" instantly confirms and locks blocks
- [ ] Claimed blocks no longer visible to other instructors

---

### Phase 4: Release Controls & Reminders
**Status:** ✅ COMPLETE
**Goal:** Add admin controls for program release and reminder notification flow.

**Deliverables:**
- Supabase admin functions: release_program, release_all, skip_tier
- n8n workflow: reminder email at 50% tier window
- n8n workflow: cancellation re-release notification
- Admin API endpoints for program management

**Requirements:** P2, P3, N3, N5

**Acceptance Criteria:**
- [ ] Admin can flip switch to release individual program to Tier 0
- [ ] Admin can bulk-release all unreleased programs
- [ ] Reminder email sent at 50% through each tier window
- [ ] When claim cancelled, all qualified instructors in current tier notified immediately

---

### Phase 5: Business OS Dashboard Integration
**Status:** ✅ COMPLETE
**Goal:** Build the admin dashboard widget for monitoring and managing the recruitment pipeline.

**Deliverables:**
- Dashboard summary widget (Program Coordination section)
- Program status table with all required columns
- Action buttons: assign, skip tier, nudge, override
- "Not responded" view
- Real-time status updates

**Requirements:** B1, B2, B3, B4, B5, B6, B7, B8

**Acceptance Criteria:**
- [ ] Widget shows count of programs in each status
- [ ] Table displays all programs with current tier, days remaining, notification stats
- [ ] Admin can manually assign instructor from dashboard
- [ ] Admin can skip tier early from dashboard
- [ ] Admin can send reminder nudge from dashboard
- [ ] Admin can remove/override existing claim from dashboard

**Plans:**
- [x] 05-01-PLAN.md — Supabase dashboard views (Wave 1)
- [x] 05-02-PLAN.md — Query file with TypeScript types (Wave 1)
- [x] 05-03-PLAN.md — Server actions for admin operations (Wave 2)
- [x] 05-04-PLAN.md — Dashboard page and skeleton (Wave 2)
- [x] 05-05-PLAN.md — Content component and summary cards (Wave 3)
- [x] 05-06-PLAN.md — Recruitment pipeline table (Wave 3)
- [x] 05-07-PLAN.md — Not responded list and modals (Wave 4)

---

## Phase Summary

| Phase | Name | Dependencies |
|-------|------|--------------|
| 1 | Foundation & Data Migration | None |
| 2 | Tier Engine & Notifications | Phase 1 |
| 3 | Instructor Sign-up Page | Phase 2 |
| 4 | Release Controls & Reminders | Phase 2, 3 |
| 5 | Business OS Dashboard | Phase 1, 2, 3 |

---

## Future Milestones (v2+)

### Milestone 2: Analytics & Insights
- Instructor response tracking (viewed but not claimed)
- Historical teaching record display
- Dashboard alerts (unfilled programs, unresponsive VIPs)

### Milestone 3: Enhanced Matching
- Travel distance calculation (replace state-based)
- Instructor preference capture
- Waitlist functionality
