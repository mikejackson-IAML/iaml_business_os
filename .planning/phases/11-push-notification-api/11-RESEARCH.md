# Phase 11: Push Notification API - Research

**Researched:** 2026-01-21
**Domain:** APNs integration, device token management, notification triggers, scheduled digest jobs
**Confidence:** HIGH

## Summary

This phase implements the backend infrastructure for sending push notifications via Apple Push Notification service (APNs). The research confirms that `@parse/node-apn` is the recommended Node.js library for APNs integration, supporting token-based authentication with .p8 keys over HTTP/2. Device tokens should be stored in Supabase with user association and status tracking. Notification triggers will come from n8n webhooks (for workflow completions) and direct API calls (for critical alerts). The daily digest can be scheduled via Vercel Cron (simplest) or Supabase pg_cron (more control).

Critical Alerts require a special entitlement from Apple that must be requested separately. Given this project's use case (business monitoring), the entitlement request has a reasonable chance of approval, but the feature should be designed to gracefully degrade to standard notifications if not approved.

**Primary recommendation:** Use `@parse/node-apn` with token-based authentication, store device tokens in a new `mobile_device_tokens` table in Supabase, trigger notifications via dedicated API endpoints called by n8n webhooks and internal triggers, and use Vercel Cron for daily digest scheduling at a single UTC time (user-configurable offset handled server-side).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@parse/node-apn` | 6.0+ | APNs HTTP/2 client | Maintained fork of node-apn, supports token auth, HTTP/2, batch sending |
| Supabase (PostgreSQL) | Existing | Device token storage | Already in stack, row-level security available |
| Vercel Cron | Native | Daily digest scheduling | Built into Vercel, no extra infrastructure |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `pg_cron` + `pg_net` | Supabase native | Alternative scheduling | If more granular timezone control needed |
| `date-fns-tz` | 3.x | Timezone calculations | Converting user local time to UTC for scheduling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@parse/node-apn` | `apns2` | apns2 is simpler but less maintained; @parse/node-apn has Parse Server community support |
| Vercel Cron | Supabase pg_cron | pg_cron is more flexible but adds complexity; Vercel Cron is sufficient for daily digest |
| Direct APNs | Firebase Cloud Messaging | FCM adds Google dependency; APNs directly is simpler for iOS-only |

**Installation:**
```bash
cd dashboard
npm install @parse/node-apn date-fns-tz
```

## Architecture Patterns

### Recommended Project Structure
```
dashboard/src/
├── app/api/mobile/
│   ├── notifications/
│   │   ├── register/route.ts     # POST - Store device token
│   │   ├── send/route.ts         # POST - Internal: send notification (n8n calls this)
│   │   └── digest/route.ts       # POST - Cron endpoint for daily digest
│   └── health/route.ts           # Existing
├── lib/api/
│   ├── apns-provider.ts          # APNs client singleton
│   ├── notifications.ts          # Notification sending logic
│   └── device-tokens.ts          # Token CRUD operations
└── lib/types/
    └── notifications.ts          # TypeScript interfaces

BusinessCommandCenter/
├── App/
│   └── AppDelegate.swift         # Add push notification handling
├── Core/
│   └── Services/
│       └── PushNotificationService.swift  # NEW: Token registration
└── Features/
    └── Settings/
        └── NotificationSettingsView.swift  # Phase 12 (UI only)
```

### Pattern 1: APNs Provider Singleton

**What:** Single APNs connection reused across requests
**When to use:** All notification sending operations
**Example:**
```typescript
// dashboard/src/lib/api/apns-provider.ts
import apn from '@parse/node-apn';

let provider: apn.Provider | null = null;

export function getAPNsProvider(): apn.Provider {
  if (!provider) {
    provider = new apn.Provider({
      token: {
        key: process.env.APNS_KEY_PATH || Buffer.from(process.env.APNS_KEY_BASE64!, 'base64'),
        keyId: process.env.APNS_KEY_ID!,
        teamId: process.env.APNS_TEAM_ID!,
      },
      production: process.env.NODE_ENV === 'production',
    });
  }
  return provider;
}

// Call on shutdown (if needed)
export function shutdownAPNsProvider() {
  if (provider) {
    provider.shutdown();
    provider = null;
  }
}
```

### Pattern 2: Device Token Registration Flow

**What:** iOS app registers device token on launch
**When to use:** Every app launch (tokens can change)
**Example:**
```typescript
// POST /api/mobile/notifications/register
interface RegisterTokenRequest {
  device_token: string;
  device_name?: string;
  os_version?: string;
  app_version?: string;
  timezone?: string;  // IANA format: "America/Chicago"
}

// Response
interface RegisterTokenResponse {
  success: boolean;
  message: string;
}
```

### Pattern 3: Notification Trigger from n8n

**What:** n8n workflow completion triggers push notification
**When to use:** User-triggered workflow completes (success or failure)
**Example:**
```typescript
// n8n workflow ends with HTTP Request node calling:
// POST /api/mobile/notifications/send
interface SendNotificationRequest {
  type: 'workflow_complete' | 'critical_alert' | 'digest';
  title: string;
  body: string;
  data?: {
    workflow_id?: string;
    execution_id?: string;
    status?: 'success' | 'failure';
    deep_link?: string;
  };
  critical?: boolean;  // Use critical alert (if entitlement approved)
}
```

### Pattern 4: Quiet Hours Check

**What:** Check if user has quiet hours enabled before sending
**When to use:** All non-critical notifications
**Example:**
```typescript
// dashboard/src/lib/api/notifications.ts
export async function shouldSendNotification(
  userId: string,
  isCritical: boolean
): Promise<boolean> {
  if (isCritical) return true;  // Critical alerts bypass quiet hours

  const settings = await getUserNotificationSettings(userId);
  if (!settings.quiet_hours_enabled) return true;

  const userLocalHour = getCurrentHourInTimezone(settings.timezone);
  const quietStart = settings.quiet_hours_start;  // e.g., 22 (10pm)
  const quietEnd = settings.quiet_hours_end;      // e.g., 7 (7am)

  // Check if current hour is in quiet range
  if (quietStart > quietEnd) {
    // Wraps around midnight (e.g., 22-7)
    return userLocalHour >= quietEnd && userLocalHour < quietStart;
  } else {
    // Same day range (e.g., 1-6)
    return userLocalHour < quietStart || userLocalHour >= quietEnd;
  }
}
```

### Anti-Patterns to Avoid
- **Creating provider per request:** APNs connections are expensive; reuse the singleton
- **Storing .p8 key in code:** Use environment variable with base64 encoding
- **Ignoring token bounces:** Mark tokens as invalid when APNs rejects them
- **Sending to all tokens synchronously:** Batch send for performance
- **Hardcoding notification times:** Always use user timezone preferences

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| APNs HTTP/2 connection | Raw HTTP/2 client | `@parse/node-apn` | Connection pooling, retry logic, error handling |
| Timezone calculations | Manual offset math | `date-fns-tz` | DST handling, IANA timezone support |
| Cron scheduling | Custom timer | Vercel Cron / pg_cron | Reliability, monitoring, no infrastructure |
| Device token validation | Regex check | APNs response | APNs tells you if token is invalid |

**Key insight:** The APNs protocol has many edge cases (connection drops, token expiration, error codes). Using a maintained library like `@parse/node-apn` handles these correctly.

## Common Pitfalls

### Pitfall 1: Not Handling Token Invalidation

**What goes wrong:** Sending to invalid tokens wastes resources and hits rate limits
**Why it happens:** Tokens become invalid when app is uninstalled or user revokes permissions
**How to avoid:**
- Check APNs response for failed tokens
- Mark tokens as `bounced` in database
- Clean up bounced tokens periodically
**Warning signs:** APNs returns `BadDeviceToken` or `Unregistered` errors

### Pitfall 2: Forgetting to Request Critical Alerts Entitlement

**What goes wrong:** App crashes or notification fails when sending critical alert
**Why it happens:** Critical alerts require Apple approval and special entitlement
**How to avoid:**
- Request entitlement at: https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
- Add `.criticalAlert` to permission request
- Design fallback to standard alerts
**Warning signs:** Notifications don't bypass DND, or app rejected by Apple

### Pitfall 3: Wrong APNs Environment

**What goes wrong:** Notifications silently fail (development vs production)
**Why it happens:** Development tokens only work with sandbox APNs, production with production APNs
**How to avoid:**
- Use `NODE_ENV=production` check
- Store environment with device token
- Test with TestFlight (uses production APNs)
**Warning signs:** Notifications work in development but not production (or vice versa)

### Pitfall 4: Timezone Edge Cases in Digest Scheduling

**What goes wrong:** Users receive digest at wrong time (especially around DST changes)
**Why it happens:** Storing offset instead of IANA timezone, or not recalculating
**How to avoid:**
- Store IANA timezone (e.g., "America/Chicago"), not offset
- Calculate send time server-side using `date-fns-tz`
- Recalculate on each digest run
**Warning signs:** Digest times shift by an hour twice a year

### Pitfall 5: Alert Batching Logic Errors

**What goes wrong:** Multiple notifications sent when batching should combine them
**Why it happens:** Race condition between alert triggers and batch window
**How to avoid:**
- Use database transaction with FOR UPDATE lock
- Check pending batch before creating new one
- Use Supabase edge function or n8n for coordination
**Warning signs:** User receives 5 separate notifications instead of 1 combined

## APNs Integration Details

### Authentication Setup

APNs requires token-based authentication using a .p8 key from Apple Developer Console.

**Steps to get .p8 key:**
1. Go to Apple Developer Console > Certificates, Identifiers & Profiles
2. Create a new Key with "Apple Push Notifications service (APNs)" enabled
3. Download the .p8 file (can only download once)
4. Note the Key ID (10 characters)
5. Note your Team ID (from account membership)

**Environment Variables:**
```bash
APNS_KEY_ID=XXXXXXXXXX           # 10-character Key ID
APNS_TEAM_ID=XXXXXXXXXX          # Your Apple Team ID
APNS_KEY_BASE64=<base64 encoded .p8 file content>
APNS_BUNDLE_ID=com.iaml.businesscommandcenter
```

### Notification Payload Format

**Standard Notification:**
```json
{
  "aps": {
    "alert": {
      "title": "Workflow Complete",
      "body": "Domain Health check finished successfully"
    },
    "badge": 1,
    "sound": "default",
    "category": "WORKFLOW_COMPLETE"
  },
  "workflow_id": "HnZQopXL7xjZnX3O",
  "execution_id": "12345",
  "status": "success"
}
```

**Critical Alert Notification:**
```json
{
  "aps": {
    "alert": {
      "title": "System Alert",
      "body": "Email deliverability dropped below 80%"
    },
    "sound": {
      "critical": 1,
      "name": "critical_alert.caf",
      "volume": 1.0
    },
    "category": "CRITICAL_ALERT"
  },
  "alert_type": "deliverability",
  "deep_link": "businesscommandcenter://alerts/123"
}
```

**Silent Notification (Background Update):**
```json
{
  "aps": {
    "content-available": 1
  },
  "refresh_type": "health_data"
}
```

### Sending Notifications

```typescript
// dashboard/src/lib/api/notifications.ts
import apn from '@parse/node-apn';
import { getAPNsProvider } from './apns-provider';

interface NotificationPayload {
  title: string;
  body: string;
  badge?: number;
  data?: Record<string, unknown>;
  critical?: boolean;
  category?: string;
}

export async function sendPushNotification(
  deviceToken: string,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  const provider = getAPNsProvider();

  const note = new apn.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  note.alert = { title: payload.title, body: payload.body };
  note.topic = process.env.APNS_BUNDLE_ID!;

  if (payload.badge !== undefined) {
    note.badge = payload.badge;
  }

  if (payload.critical) {
    note.sound = {
      critical: 1,
      name: 'default',
      volume: 1.0,
    };
    note.pushType = 'alert';
  } else {
    note.sound = 'default';
  }

  if (payload.category) {
    note.category = payload.category;
  }

  if (payload.data) {
    note.payload = payload.data;
  }

  try {
    const result = await provider.send(note, deviceToken);

    if (result.failed.length > 0) {
      const failure = result.failed[0];
      return {
        success: false,
        error: failure.response?.reason || 'Unknown error',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Send failed',
    };
  }
}
```

## Device Token Management

### Database Schema

```sql
-- Add to Supabase migrations
CREATE TABLE IF NOT EXISTS mobile_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Device identification
  device_token TEXT NOT NULL,
  device_name TEXT,
  os_version TEXT,
  app_version TEXT,

  -- User association (for future multi-user support)
  -- For now, single user, but structure allows expansion
  user_identifier TEXT DEFAULT 'primary',

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'bounced', 'revoked')),
  bounce_reason TEXT,
  bounced_at TIMESTAMPTZ,

  -- Notification preferences (stored with token for efficiency)
  timezone TEXT DEFAULT 'America/Chicago',  -- IANA format
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start INTEGER DEFAULT 22,     -- 10pm local
  quiet_hours_end INTEGER DEFAULT 7,        -- 7am local
  digest_enabled BOOLEAN DEFAULT TRUE,
  digest_hour INTEGER DEFAULT 7,            -- 7am local

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(device_token)
);

-- Index for active token lookup
CREATE INDEX idx_device_tokens_status ON mobile_device_tokens(status) WHERE status = 'active';
CREATE INDEX idx_device_tokens_user ON mobile_device_tokens(user_identifier);
```

### Token Registration Endpoint

```typescript
// POST /api/mobile/notifications/register
export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.MOBILE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { device_token, device_name, os_version, app_version, timezone } = body;

  if (!device_token) {
    return NextResponse.json({ error: 'device_token required' }, { status: 400 });
  }

  // Upsert token (update if exists, insert if new)
  const { error } = await supabase
    .from('mobile_device_tokens')
    .upsert({
      device_token,
      device_name,
      os_version,
      app_version,
      timezone: timezone || 'America/Chicago',
      status: 'active',
      updated_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: 'device_token',
    });

  if (error) {
    console.error('Token registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Token registered' });
}
```

## Notification Triggers

### Critical Alerts

Critical alerts should be triggered by n8n workflows or direct API calls when thresholds are breached.

**Trigger Sources:**
1. Health monitoring workflows detect critical condition
2. Workflow calls POST /api/mobile/notifications/send with `critical: true`
3. API checks quiet hours (critical bypasses), sends notification

**Critical Alert Conditions (from CONTEXT.md):**
- System down
- Payment failed
- Deliverability below threshold
- Other severity determined by Claude's discretion

**Batching Logic:**
If 3+ alerts fire within 5 minutes, combine into single notification:
```typescript
async function checkAndBatchAlerts(alert: Alert): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Check for pending batch
  const { data: pending } = await supabase
    .from('notification_batches')
    .select('*')
    .eq('status', 'pending')
    .gte('created_at', fiveMinutesAgo.toISOString())
    .single();

  if (pending && pending.alert_count >= 2) {
    // Add to existing batch and send combined
    await sendBatchedNotification(pending.id, alert);
    return true;  // Batched
  }

  if (pending) {
    // Add to batch, wait for more
    await addToBatch(pending.id, alert);
    return true;  // Batched, will send later
  }

  // Start new potential batch
  await createBatchWithAlert(alert);

  // Schedule batch check in 5 minutes
  // (Could use setTimeout or separate cron)
  return false;  // Sent immediately if timer expires with < 3 alerts
}
```

### Workflow Completion Notifications

When a user-triggered workflow completes:

**n8n Workflow Pattern:**
```
[Webhook Trigger] → [Workflow Logic] → [Set Result] → [HTTP Request to Send Notification]
```

**HTTP Request Node Configuration:**
```json
{
  "url": "https://api.iaml.io/mobile/notifications/send",
  "method": "POST",
  "headers": {
    "X-API-Key": "{{$env.MOBILE_API_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "type": "workflow_complete",
    "title": "{{$json.workflow_name}} Complete",
    "body": "{{$json.status === 'success' ? 'Completed successfully' : 'Failed: ' + $json.error}}",
    "data": {
      "workflow_id": "{{$json.workflow_id}}",
      "execution_id": "{{$json.execution_id}}",
      "status": "{{$json.status}}"
    }
  }
}
```

## Daily Digest Scheduling

### Option A: Vercel Cron (Recommended)

**Simplest approach:** Single UTC time, server calculates user's local time.

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/mobile/notifications/digest",
      "schedule": "0 * * * *"  // Every hour, on the hour
    }
  ]
}
```

```typescript
// POST /api/mobile/notifications/digest (called by Vercel Cron)
export async function POST(request: NextRequest) {
  // Verify cron secret or internal call
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentHourUTC = new Date().getUTCHours();

  // Get all users whose digest_hour matches current hour in their timezone
  const { data: tokens } = await supabase
    .from('mobile_device_tokens')
    .select('*')
    .eq('status', 'active')
    .eq('digest_enabled', true);

  for (const token of tokens || []) {
    const userLocalHour = getCurrentHourInTimezone(token.timezone);
    if (userLocalHour === token.digest_hour) {
      await generateAndSendDigest(token);
    }
  }

  return NextResponse.json({ success: true });
}
```

### Option B: Supabase pg_cron

More control, runs in database context:

```sql
-- Schedule digest generation hourly
SELECT cron.schedule(
  'daily-digest-check',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://api.iaml.io/mobile/notifications/digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Digest Content Generation

```typescript
interface DigestContent {
  unresolved_alerts: number;
  alerts_summary?: string;
  health_score: number;
  health_status: string;
  workflows_triggered: number;
  workflows_failed: number;
}

async function generateDigestContent(): Promise<DigestContent> {
  // Get unresolved alerts
  const { data: alerts } = await supabase
    .from('health_alerts')  // Or wherever alerts are stored
    .select('*')
    .eq('resolved', false);

  // Get current health score
  const healthData = await getMobileHealthData();

  // Get workflow activity from last 24 hours
  const { data: runs } = await supabase
    .from('n8n_brain.workflow_runs')
    .select('status')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const triggered = runs?.length || 0;
  const failed = runs?.filter(r => r.status === 'failed').length || 0;

  return {
    unresolved_alerts: alerts?.length || 0,
    alerts_summary: alerts?.length ? `${alerts.length} alerts need attention` : undefined,
    health_score: healthData.overallHealth.score,
    health_status: healthData.overallHealth.status,
    workflows_triggered: triggered,
    workflows_failed: failed,
  };
}
```

## iOS Implementation Notes

### AppDelegate Setup

```swift
// AppDelegate.swift
import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        registerForPushNotifications()
        return true
    }

    func registerForPushNotifications() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .badge, .sound, .criticalAlert]  // .criticalAlert requires entitlement
        ) { granted, error in
            guard granted else { return }

            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()

        // Send to backend
        Task {
            await PushNotificationService.shared.registerToken(token)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for push: \(error)")
    }

    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        // Handle deep link from userInfo
        completionHandler()
    }
}
```

### SwiftUI App Integration

```swift
@main
struct BusinessCommandCenterApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
```

## Critical Alerts Entitlement

### Requesting the Entitlement

1. Go to: https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
2. Fill out the form explaining use case (business monitoring, system health alerts)
3. Wait for Apple review (can take 1-2 weeks)

**Justification for this app:**
- Business operations monitoring tool
- Critical alerts for system outages, payment failures
- Single-operator use case (not consumer app)
- Bypassing DND necessary for immediate action on business-critical issues

### After Approval

1. Create new provisioning profiles with Critical Alerts capability
2. Add to entitlements file:
```xml
<key>com.apple.developer.usernotifications.critical-alerts</key>
<true/>
```

3. Request `.criticalAlert` permission:
```swift
UNUserNotificationCenter.current().requestAuthorization(
    options: [.alert, .badge, .sound, .criticalAlert]
)
```

### Fallback Design

If entitlement is not approved:
- Standard high-priority notifications still work
- Remove `.criticalAlert` from permission request
- Document limitation for user
- Standard alerts still respect user's notification settings

## Code Examples

### Complete Registration Endpoint

```typescript
// dashboard/src/app/api/mobile/notifications/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RegisterRequest {
  device_token: string;
  device_name?: string;
  os_version?: string;
  app_version?: string;
  timezone?: string;
}

export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.MOBILE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RegisterRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.device_token || typeof body.device_token !== 'string') {
    return NextResponse.json({ error: 'device_token is required' }, { status: 400 });
  }

  // Validate token format (64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(body.device_token)) {
    return NextResponse.json({ error: 'Invalid device token format' }, { status: 400 });
  }

  const { error } = await supabase
    .from('mobile_device_tokens')
    .upsert({
      device_token: body.device_token,
      device_name: body.device_name,
      os_version: body.os_version,
      app_version: body.app_version,
      timezone: body.timezone || 'America/Chicago',
      status: 'active',
      bounce_reason: null,
      bounced_at: null,
      updated_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: 'device_token',
    });

  if (error) {
    console.error('Token registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Device token registered successfully',
  });
}
```

### Complete Send Notification Endpoint

```typescript
// dashboard/src/app/api/mobile/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/api/notifications';
import { getActiveDeviceTokens } from '@/lib/api/device-tokens';
import { shouldSendNotification } from '@/lib/api/notifications';

interface SendRequest {
  type: 'workflow_complete' | 'critical_alert' | 'digest';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  critical?: boolean;
}

export async function POST(request: NextRequest) {
  // Validate internal API key or n8n webhook secret
  const apiKey = request.headers.get('X-API-Key');
  const webhookSecret = request.headers.get('X-Webhook-Secret');

  const isAuthorized =
    apiKey === process.env.MOBILE_API_KEY ||
    webhookSecret === process.env.N8N_WEBHOOK_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SendRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: 'title and body are required' },
      { status: 400 }
    );
  }

  // Get active device tokens
  const tokens = await getActiveDeviceTokens();

  if (tokens.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No active devices to notify',
      sent: 0,
    });
  }

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    // Check quiet hours (unless critical)
    const shouldSend = await shouldSendNotification(
      token.user_identifier,
      body.critical || false
    );

    if (!shouldSend) {
      continue;  // Skip during quiet hours
    }

    const result = await sendPushNotification(token.device_token, {
      title: body.title,
      body: body.body,
      data: body.data,
      critical: body.critical,
      category: body.type.toUpperCase(),
    });

    if (result.success) {
      sent++;
    } else {
      failed++;

      // Mark token as bounced if invalid
      if (result.error === 'BadDeviceToken' || result.error === 'Unregistered') {
        await markTokenAsBounced(token.device_token, result.error);
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Certificate-based auth (.p12) | Token-based auth (.p8) | 2016 | Simpler, no expiration, one key for all apps |
| Legacy APNs binary protocol | HTTP/2 provider API | iOS 9+ | Better error handling, higher throughput |
| Manual APNs connection | `@parse/node-apn` library | Ongoing | Handles connection pooling, retries |
| User-entered offset | IANA timezone strings | Best practice | Handles DST automatically |

**Deprecated/outdated:**
- `.p12` certificate auth: Still works but tokens are preferred
- Legacy binary protocol: Deprecated, use HTTP/2
- `node-apn` original: Unmaintained, use `@parse/node-apn` fork

## Open Questions

Things that couldn't be fully resolved:

1. **Critical Alerts Entitlement Approval**
   - What we know: Requires Apple approval, business monitoring is a valid use case
   - What's unclear: Approval timeline and whether our specific use case qualifies
   - Recommendation: Apply early, design fallback to standard notifications

2. **Badge Count Strategy**
   - What we know: Badges show unread notification count
   - What's unclear: Should it show unresolved alerts, unread notifications, or something else?
   - Recommendation: Start with unresolved alert count, adjust based on user feedback

3. **Notification Grouping**
   - What we know: iOS supports thread identifiers for grouping
   - What's unclear: Best grouping strategy (by type? by source workflow? none?)
   - Recommendation: Group by type initially (workflow_complete, critical_alert, digest)

## Sources

### Primary (HIGH confidence)
- [@parse/node-apn GitHub](https://github.com/parse-community/node-apn) - APNs library documentation
- [Apple: Creating Remote Notification Payload](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CreatingtheNotificationPayload.html) - Payload format
- [Apple: Critical Alerts](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.usernotifications.critical-alerts) - Entitlement requirements
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - Scheduling documentation
- [Supabase Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) - pg_cron setup

### Secondary (MEDIUM confidence)
- [iOS Push Notifications Complete Guide 2026](https://medium.com/@khmannaict13/ios-push-notifications-the-complete-setup-guide-for-2026-adfc98592ab7) - Implementation patterns
- [Implementing Push Notifications in SwiftUI](https://medium.com/@authfy/implementing-push-notifications-in-swiftui-33ea88ddf77c) - iOS code patterns
- [APNs Device Tokens - NSHipster](https://nshipster.com/apns-device-tokens/) - Token management best practices
- [Scheduling Push by Timezone - OneSignal](https://onesignal.com/blog/deliver-by-timezone-push-notification/) - Timezone handling patterns

### Tertiary (LOW confidence)
- Critical Alerts approval likelihood - Based on community forum discussions, not official guidance

## Metadata

**Confidence breakdown:**
- APNs integration: HIGH - Official Apple docs, maintained library
- Device token storage: HIGH - Standard database patterns
- Notification triggers: HIGH - Follows existing Phase 10 patterns
- Daily digest scheduling: HIGH - Vercel/Supabase well-documented
- Critical Alerts entitlement: MEDIUM - Depends on Apple approval

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - stable patterns)
