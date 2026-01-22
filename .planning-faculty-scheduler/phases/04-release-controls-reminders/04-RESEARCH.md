# Phase 4 Research: Release Controls & Reminders

## Summary

- **release_program() already exists** in Phase 1 schema — Phase 4 focuses on release_all() and skip_tier()
- **Reminder workflow:** Daily scheduler checks for programs at 50% tier window, sends personalized emails
- **Cancellation workflow:** Webhook-triggered when claim cancelled, immediately notifies all qualified instructors
- **API endpoints deferred** to Phase 5 — Phase 4 builds Supabase functions + n8n workflows only
- **Existing patterns are solid:** Tier Advancement, Faculty Availability, Claim Confirmation workflows provide templates

## Admin Functions (What Needs to Be Built)

### 1. release_all()
- **Status:** Needs to be built
- **Purpose:** Bulk-release all draft programs to Tier 0
- **Caller:** Admin from dashboard or API endpoint
- **Returns:** count of programs released + array of program IDs
- **Implementation:** Loop through all draft programs, call release_program() logic
- **Side effect:** Triggers notification workflow for each released program

### 2. skip_tier()
- **Status:** Needs to be built
- **Purpose:** Admin can skip a program from tier_0 → tier_1 → tier_2 early
- **Caller:** Admin from dashboard
- **Parameter:** program_id and target tier (tier_1 or tier_2)
- **Returns:** success status, previous tier, new tier
- **Side effect:** Must trigger notification workflow when tier changes
- **Safety:** Should verify program exists and isn't already filled

### 3. release_program()
- **Status:** ✅ Already exists (Phase 1)
- **Location:** supabase/migrations/20260120_create_faculty_scheduler_schema.sql
- **Note:** Releases a single draft program to tier_0

## Reminder Workflow Design

**Requirement N3:** Reminder email sent at 50% through tier window

**Timing logic:**
- Tier 0: 7 days total → reminder at day 3.5 (after ~3-4 days)
- Tier 1: 5 days total → reminder at day 2.5 (after ~2-3 days)

**Implementation:**
1. Daily scheduler at 7 AM CT queries for programs where reminder should be sent
2. For each program, fetch instructors eligible at current tier who haven't received reminder yet
3. Send personalized reminder email with current open block count
4. Log notification in database (notification_type = 'reminder')

**New Supabase function needed:** `get_instructors_needing_reminder(program_id)`
- Determines current tier from program status
- Gets instructors qualified for that tier
- Checks they haven't already received a reminder notification
- Includes magic token for link
- Includes open block count for dynamic content

## Cancellation Re-release Design

**Requirement N5:** When spot opens (claim cancelled), notify all qualified instructors immediately

**Trigger:** Webhook called after cancel_claim() executes

**Flow:**
1. Admin or instructor cancels claim
2. cancel_claim() function updates claim status to 'cancelled' and re-opens block
3. External system (dashboard or automated) calls n8n webhook with cancellation details
4. n8n fetches all instructors eligible at current tier
5. n8n sends "New opening!" email to each

**New Supabase function needed:** `get_instructors_for_rerelease(program_id)`
- Gets program details and current tier
- Returns all instructors eligible at current tier
- Excludes instructors who already have an active claim on this program
- Includes magic token for direct link

## API Endpoints Approach

**Phase 4 scope:** Supabase functions + n8n workflows only
**Phase 5 scope:** API routes in faculty-portal that expose these functions

**Deferred endpoints (for Phase 5 planning):**
```
POST /api/admin/programs/:id/release
POST /api/admin/programs/release-all
POST /api/admin/programs/:id/skip-tier
POST /api/admin/notifications/:program_id/send-reminder
DELETE /api/admin/claims/:claim_id
```

## Key Files to Reference

**Schema migrations:**
- `supabase/migrations/20260120_create_faculty_scheduler_schema.sql` - Core tables and functions
- `supabase/migrations/20260121_faculty_scheduler_phase2.sql` - Notifications and magic tokens
- `supabase/migrations/20260121_faculty_scheduler_phase3.sql` - Available programs API

**Verified n8n workflows (use as patterns):**
- Faculty Availability Tracker (GOiy6L7XYjevYDSA) - Sends tier release emails
- Tier Advancement (23UINuBMopcU4LTm) - Auto-advances tiers daily
- Claim Confirmation (CxPvF01qUzvREo9R) - Sends confirmation email

**n8n-brain learnings from Phase 2:**
1. Webhook body: Use `$json.body.field` not `$json.field`
2. Reference upstream nodes: Use `$('Node Name').item.json.field`
3. Webhook response: Must have `responseMode: "responseNode"` if using Respond to Webhook node
4. If conditions: Use `typeValidation: "loose"` and `exists` operator
5. SQL apostrophes: Escape with `.replace(/'/g, "''")`

## Open Questions

1. **Release timing** - When release_all() is called, should it immediately trigger tier_0 notification emails, or wait for daily scheduler?
   - **Recommendation:** Immediate trigger via webhook to notify instructors same-day

2. **Manual reminder trigger** - Should admin be able to force-send reminder before 50% point?
   - **Recommendation:** Add manual API endpoint that bypasses schedule check (Phase 5)

3. **Multi-block programs** - If one block is cancelled but others still claimed, is program still "filled"?
   - **Answer:** Program status depends on `COUNT(blocks) WHERE status = 'open'` — works correctly

4. **Instructors who already claimed** - Should reminder emails go to them, or only unclaimed instructors?
   - **Recommendation:** Only unclaimed (avoid email fatigue for committed instructors)

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|------------|-------|
| Supabase functions | 85% | Clear patterns from Phase 1, straightforward SQL |
| Reminder workflow | 75% | Uses existing SendGrid and notification logging patterns |
| Cancellation workflow | 80% | Similar to existing tier_release workflow but event-triggered |
| API endpoints | 70% | Deferred to Phase 5, but clear Next.js + Supabase RPC patterns |
