# Faculty Scheduler - Cancellation Re-release

> **CEO Summary:** Instantly notifies all qualified instructors when a teaching spot opens up due to cancellation, giving them a chance to claim the newly available block.

## What It Does

When an instructor's claim is cancelled (by admin or instructor), this workflow immediately notifies all eligible instructors that a spot has become available. The urgency messaging encourages quick action since spots are first-come, first-served.

## Trigger

- **Type:** Webhook (POST)
- **Path:** `/webhook/faculty-scheduler-rerelease`
- **URL:** `https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease`
- **Caller:** Admin dashboard (Phase 5) after `cancel_claim()` succeeds

## Webhook Payload

```json
{
  "program_id": "uuid",
  "block_id": "uuid",
  "block_name": "Block 1",
  "cancelled_by": "admin"
}
```

## Data Flow

1. Receive webhook with cancellation details
2. Query program status to verify it's still in active tier (tier_0, tier_1, tier_2)
3. Call `get_instructors_for_rerelease()` to find eligible instructors
4. Loop through each instructor and send urgent email via SendGrid
5. Log notification to database with type='rerelease'
6. Respond with count of instructors notified

## Response Format

**Success (instructors notified):**
```json
{
  "success": true,
  "instructors_notified": 5
}
```

**Success (no eligible instructors):**
```json
{
  "success": true,
  "instructors_notified": 0,
  "message": "No eligible instructors to notify"
}
```

**Program not active:**
```json
{
  "success": false,
  "error": "Program not in active tier, no notifications sent",
  "program_status": "filled"
}
```

## Email Content

- **Subject:** "New Opening: [Program Name] - [Block Name]"
- **Body:**
  - Greeting with instructor's first name
  - "Great news! A teaching spot has just become available."
  - Program details (name, location, block, date)
  - Urgency banner: "This spot was just released and is available on a first-come, first-served basis."
  - CTA button: "Claim This Spot" with magic link

## Integrations

| Service | Purpose |
|---------|---------|
| Supabase | Query program details, get eligible instructors, log notifications |
| SendGrid | Send re-release notification emails |
| Slack | Error alerts via Canary pattern |

## Supabase Functions Used

- `faculty_scheduler.get_instructors_for_rerelease(program_id)` - Gets eligible instructors
- `faculty_scheduler.log_notification(...)` - Logs notification with type='rerelease'

## Alerts

- **Error handling:** Canary pattern logs errors to `n8n_brain.workflow_errors` and sends Slack alert
- **Slack channel:** #workflow-alerts

## Integration Notes

This webhook is designed to be called **explicitly** by the admin dashboard after a successful `cancel_claim()` call. This is intentional:

1. Not all cancellations warrant re-notification (e.g., entire program cancelled)
2. Admin has control over when notifications go out
3. No database triggers needed - simpler implementation

## Related

- [Faculty Scheduler - Tier Advancement](./README-tier-advancement.md)
- [Faculty Scheduler - Claim Confirmation](./README-claim-confirmation.md)
- Phase 4 Plan: `.planning-faculty-scheduler/phases/04-release-controls-reminders/04-03-PLAN.md`
