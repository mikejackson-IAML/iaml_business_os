// Push Notification Functions
// Handles sending notifications via APNs and device token management

import * as apn from '@parse/node-apn';
import { toZonedTime } from 'date-fns-tz';
import { getAPNsProvider, isAPNsConfigured } from './apns-provider';
import { getServerClient } from '../supabase/server';
import type { NotificationPayload, DeviceToken } from '../types/notifications';

// ==================== Send Notification ====================

interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Send a push notification to a single device token
 */
export async function sendPushNotification(
  deviceToken: string,
  payload: NotificationPayload
): Promise<SendResult> {
  if (!isAPNsConfigured()) {
    console.warn('APNs not configured, skipping notification');
    return { success: false, error: 'APNs not configured' };
  }

  const provider = getAPNsProvider();
  const bundleId = process.env.APNS_BUNDLE_ID;

  if (!bundleId) {
    return { success: false, error: 'APNS_BUNDLE_ID not configured' };
  }

  const note = new apn.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiry
  note.alert = { title: payload.title, body: payload.body };
  note.topic = bundleId;

  if (payload.badge !== undefined) {
    note.badge = payload.badge;
  }

  if (payload.critical) {
    // Critical alert bypasses DND (requires Apple entitlement)
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
    note.aps.category = payload.category;
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
        error: failure.response?.reason || 'Unknown APNs error',
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

// ==================== Device Token Management ====================

/**
 * Get all active device tokens
 */
export async function getActiveDeviceTokens(): Promise<DeviceToken[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('mobile_device_tokens')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching device tokens:', error);
    throw new Error('Failed to fetch device tokens');
  }

  return (data || []) as DeviceToken[];
}

/**
 * Mark a device token as bounced (invalid)
 */
export async function markTokenAsBounced(
  deviceToken: string,
  reason: string
): Promise<void> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mobile_device_tokens')
    .update({
      status: 'bounced',
      bounce_reason: reason,
      bounced_at: new Date().toISOString(),
    })
    .eq('device_token', deviceToken);

  if (error) {
    console.error('Error marking token as bounced:', error);
  }
}

// ==================== Quiet Hours ====================

/**
 * Get current hour in a timezone
 */
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const zonedDate = toZonedTime(new Date(), timezone);
    return zonedDate.getHours();
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date().getUTCHours();
  }
}

/**
 * Check if notification should be sent (respects quiet hours)
 * Critical notifications always return true
 */
export async function shouldSendNotification(
  token: DeviceToken,
  isCritical: boolean
): Promise<boolean> {
  // Critical alerts always bypass quiet hours
  if (isCritical) {
    return true;
  }

  // Check if quiet hours are enabled
  if (!token.quiet_hours_enabled) {
    return true;
  }

  const userLocalHour = getCurrentHourInTimezone(token.timezone);
  const quietStart = token.quiet_hours_start;  // e.g., 22 (10pm)
  const quietEnd = token.quiet_hours_end;      // e.g., 7 (7am)

  // Check if current hour is in quiet range
  if (quietStart > quietEnd) {
    // Wraps around midnight (e.g., 22-7 means 10pm to 7am)
    // Quiet if hour >= 22 OR hour < 7
    const isQuiet = userLocalHour >= quietStart || userLocalHour < quietEnd;
    return !isQuiet;  // Should send if NOT in quiet hours
  } else {
    // Same day range (e.g., 1-6 means 1am to 6am)
    // Quiet if hour >= 1 AND hour < 6
    const isQuiet = userLocalHour >= quietStart && userLocalHour < quietEnd;
    return !isQuiet;
  }
}

// ==================== Batch Send ====================

interface BatchSendResult {
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Send notification to all active devices
 * Respects quiet hours for non-critical notifications
 */
export async function sendToAllDevices(
  payload: NotificationPayload,
  isCritical: boolean = false
): Promise<BatchSendResult> {
  const tokens = await getActiveDeviceTokens();

  if (tokens.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const token of tokens) {
    // Check quiet hours
    const shouldSend = await shouldSendNotification(token, isCritical);

    if (!shouldSend) {
      skipped++;
      continue;
    }

    const result = await sendPushNotification(token.device_token, payload);

    if (result.success) {
      sent++;
    } else {
      failed++;

      // Mark token as bounced if APNs says it's invalid
      if (result.error === 'BadDeviceToken' || result.error === 'Unregistered') {
        await markTokenAsBounced(token.device_token, result.error);
      }
    }
  }

  return { sent, failed, skipped };
}
