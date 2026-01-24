// Mobile Device Token Registration Endpoint
// Registers or updates APNs device token for push notifications

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import type { RegisterTokenRequest, RegisterTokenResponse } from '@/lib/types/notifications';

/**
 * POST /api/mobile/notifications/register
 * Registers or updates a device token for push notifications
 *
 * Authentication: Requires X-API-Key header matching MOBILE_API_KEY env var
 *
 * Request body:
 * {
 *   device_token: string,     // Required: 64 hex character APNs token
 *   device_name?: string,     // Optional: e.g., "iPhone 15 Pro"
 *   os_version?: string,      // Optional: e.g., "17.2"
 *   app_version?: string,     // Optional: e.g., "1.0.0"
 *   timezone?: string         // Optional: IANA format, default "America/Chicago"
 * }
 *
 * Response: { success: boolean, message: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<RegisterTokenResponse | { error: string }>> {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: RegisterTokenRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.device_token || typeof body.device_token !== 'string') {
    return NextResponse.json(
      { error: 'device_token is required' },
      { status: 400 }
    );
  }

  // Validate token format (64 hex characters for APNs)
  if (!/^[a-f0-9]{64}$/i.test(body.device_token)) {
    return NextResponse.json(
      { error: 'Invalid device token format (expected 64 hex characters)' },
      { status: 400 }
    );
  }

  // Validate timezone if provided (basic check for IANA format)
  if (body.timezone && !isValidTimezone(body.timezone)) {
    return NextResponse.json(
      { error: 'Invalid timezone format (expected IANA timezone like "America/Chicago")' },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerClient();

    // Upsert device token (update if exists, insert if new)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('mobile_device_tokens')
      .upsert({
        device_token: body.device_token,
        device_name: body.device_name || null,
        os_version: body.os_version || null,
        app_version: body.app_version || null,
        timezone: body.timezone || 'America/Chicago',
        status: 'active',  // Reactivate if previously bounced
        bounce_reason: null,
        bounced_at: null,
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
  } catch (error) {
    console.error('Token registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Basic IANA timezone validation
 * Checks for common format: Area/Location
 */
function isValidTimezone(tz: string): boolean {
  // Simple validation: should contain a slash and be alphanumeric with underscores
  const tzRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;
  if (!tzRegex.test(tz)) {
    // Also allow 3-letter abbreviations like UTC, EST (less common but valid)
    return /^[A-Z]{2,4}$/.test(tz);
  }
  return true;
}
