# Plan 10-08 Summary: Digest Generation Function and API Endpoint

## Completed

All 6 tasks completed successfully.

### Task 1: Create Digest Data Generator

Created `dashboard/src/lib/email/generate-digest-data.ts` with:
- `DigestTask` interface: minimal task data (id, title, due_date)
- `DigestStats` interface: totalActive, completedThisWeek
- `DigestData` interface: criticalTasks, dueTodayTasks, overdueTasks, stats
- `generateDigestData(userId)` function that queries:
  - Critical tasks (open/in_progress with critical priority)
  - Due today tasks (using due_category from tasks_extended view, excluding critical)
  - Overdue tasks (using due_category, excluding critical)
  - Total active count
  - Completed this week count
- `hasUrgentItems(data)` helper to check if digest should be sent

### Task 2: Create API Route

Created `dashboard/src/app/api/digest/send/route.ts`:
- POST handler at `/api/digest/send`
- Accepts JSON body: `{ userId: string }` or `{ all: true }`
- Validates API key from X-API-KEY header against DIGEST_API_KEY env var

### Task 3: Single-User Digest Logic

Implemented `sendDigestToUser(user)` function:
- Fetches user profile (id, email, full_name, notification preferences)
- Skips if `notification_daily_digest` is false
- Generates digest data via `generateDigestData`
- Skips if no urgent items (hasUrgentItems returns false)
- Sends email via Resend
- Returns result status: 'sent', 'skipped', or 'failed' with reason

### Task 4: Batch Processing for "all" Mode

Implemented batch mode:
- Queries all users where `notification_daily_digest = true` and `is_active = true`
- Filters by current time matching digest_time in user's timezone
- Processes eligible users through sendDigestToUser
- Returns summary of sent/skipped/failed with optional details

### Task 5: Rate Limiting

Added rate limiting:
- `BATCH_SIZE = 10` - process 10 users at a time
- `BATCH_DELAY_MS = 1000` - 1 second delay between batches
- Uses `Promise.all` within batches for parallelism
- Delays between batches with `sleep()` utility

### Task 6: Structured JSON Response

Returns structured JSON:
```typescript
{
  success: boolean;
  sent?: number;
  skipped?: number;
  failed?: number;
  error?: string;
  details?: {
    sent: string[];
    skipped: Array<{ userId: string; reason: string }>;
    failed: Array<{ userId: string; error: string }>;
  };
}
```

## Additional Features

- Inline HTML email template (placeholder until React Email template in 10-07)
  - Friendly greeting with user's name
  - Critical tasks section (red)
  - Overdue tasks section (red)
  - Due today section (amber)
  - Stats footer
  - "View Action Center" CTA button
- `isDigestTime(digestTime, timezone)` helper for timezone-aware scheduling
- HTML escaping for security
- Date formatting for due dates

## Files Created

| File | Description |
|------|-------------|
| `dashboard/src/lib/email/generate-digest-data.ts` | Digest data generator with types |
| `dashboard/src/app/api/digest/send/route.ts` | API endpoint for sending digests |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DIGEST_API_KEY` | API key for authenticating digest requests |
| `DIGEST_FROM_EMAIL` | From address for emails (default: IAML Action Center) |
| `NEXT_PUBLIC_APP_URL` | Dashboard URL for CTA button |

## Verification Checklist

- [x] API endpoint responds to POST requests
- [x] Rejects requests without valid API key
- [x] Single user mode sends digest to specific user
- [x] Batch mode processes all eligible users
- [x] Skips users with digest disabled
- [x] Returns accurate counts in response
- [x] Handles errors gracefully without crashing

## Commits

1. `feat(10-08): Create digest data generator`
2. `feat(10-08): Create digest send API endpoint`
