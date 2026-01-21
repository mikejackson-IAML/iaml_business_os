// Daily Digest Cron Endpoint
// Called hourly by Vercel Cron, sends digest to users whose digest hour has arrived

import { NextRequest, NextResponse } from 'next/server';
import { getActiveDeviceTokens, sendPushNotification } from '@/lib/api/notifications';
import { isDigestTime, generateDigestContent, formatDigestNotification } from '@/lib/api/digest';
import type { DigestResponse } from '@/lib/types/notifications';

/**
 * POST /api/mobile/notifications/digest
 * Called by Vercel Cron every hour to send daily digests
 *
 * Authentication: CRON_SECRET via Authorization header (set by Vercel)
 *
 * The endpoint:
 * 1. Gets all active device tokens
 * 2. Filters to tokens where current hour matches user's digest_hour in their timezone
 * 3. Generates digest content
 * 4. Sends notification to matching devices
 *
 * Response: { success: boolean, processed: number, sent: number }
 */
export async function POST(request: NextRequest): Promise<NextResponse<DigestResponse | { error: string }>> {
  // Validate cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, Vercel cron jobs include the CRON_SECRET
  // In development, allow calls without secret for testing
  const isProduction = process.env.NODE_ENV === 'production';
  const isValidCron = authHeader === `Bearer ${cronSecret}`;

  if (isProduction && !isValidCron) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get all active device tokens
    const tokens = await getActiveDeviceTokens();

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
      });
    }

    // Filter to tokens where it's digest time
    const tokensToNotify = tokens.filter(token => isDigestTime(token));

    if (tokensToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        processed: tokens.length,
        sent: 0,
      });
    }

    // Generate digest content (same for all users)
    const digestContent = await generateDigestContent();
    const notification = formatDigestNotification(digestContent);

    // Skip if "all quiet" (formatDigestNotification returns null)
    if (!notification) {
      console.log('Digest skipped: all quiet');
      return NextResponse.json({
        success: true,
        processed: tokensToNotify.length,
        sent: 0,
      });
    }

    // Send to all matching devices
    let sent = 0;
    for (const token of tokensToNotify) {
      const result = await sendPushNotification(token.device_token, notification);
      if (result.success) {
        sent++;
      }
    }

    console.log(`Digest sent: processed=${tokens.length}, eligible=${tokensToNotify.length}, sent=${sent}`);

    return NextResponse.json({
      success: true,
      processed: tokensToNotify.length,
      sent,
    });
  } catch (error) {
    console.error('Digest cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process digest' },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing in browser (development only)
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // In development, forward to POST handler
  return POST(request);
}
