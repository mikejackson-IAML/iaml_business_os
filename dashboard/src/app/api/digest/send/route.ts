/**
 * Daily Digest Email API Endpoint
 *
 * POST /api/digest/send
 *
 * Called by n8n workflow to send daily digest emails at the appropriate
 * time for each user based on their timezone and preferred digest time.
 *
 * Authentication: X-API-KEY header must match DIGEST_API_KEY env var
 *
 * Request body:
 * - { userId: string } - Send digest to specific user
 * - { all: true } - Process all eligible users
 *
 * Response:
 * - { success: true, sent: number, skipped: number, failed: number }
 * - { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { generateDigestData, hasUrgentItems, type DigestData } from '@/lib/email/generate-digest-data';
import { resend, isEmailConfigured } from '@/lib/email/resend';

// API key for authentication (set in environment)
const DIGEST_API_KEY = process.env.DIGEST_API_KEY;

// Batch size for processing multiple users
const BATCH_SIZE = 10;

// Delay between batches (ms)
const BATCH_DELAY_MS = 1000;

// Default "from" address for digest emails
const FROM_EMAIL = process.env.DIGEST_FROM_EMAIL || 'IAML Action Center <actioncenter@iaml.com>';

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if current time matches user's digest time in their timezone
 */
function isDigestTime(digestTime: string, timezone: string): boolean {
  try {
    // Get current time in user's timezone
    const now = new Date();
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    // Compare HH:MM
    return userTime === digestTime;
  } catch {
    console.warn(`Invalid timezone: ${timezone}`);
    return false;
  }
}

/**
 * User profile data needed for digest
 */
interface UserDigestProfile {
  id: string;
  email: string;
  full_name: string | null;
  notification_daily_digest: boolean;
  notification_digest_time: string;
  timezone: string;
}

/**
 * Send digest email to a single user
 * Returns 'sent', 'skipped', or 'failed' with optional error message
 */
async function sendDigestToUser(
  user: UserDigestProfile
): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> {
  // Check if digest is enabled
  if (!user.notification_daily_digest) {
    return { status: 'skipped', error: 'digest_disabled' };
  }

  // Generate digest data
  let digestData: DigestData;
  try {
    digestData = await generateDigestData(user.id);
  } catch (error) {
    return {
      status: 'failed',
      error: `Failed to generate digest data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  // Skip if nothing urgent
  if (!hasUrgentItems(digestData)) {
    return { status: 'skipped', error: 'nothing_urgent' };
  }

  // Check if Resend is configured
  if (!resend || !isEmailConfigured()) {
    return { status: 'failed', error: 'Email service not configured' };
  }

  // Build email content
  const recipientName = user.full_name || user.email.split('@')[0];
  const subject = buildSubject(digestData);
  const html = buildEmailHtml(recipientName, digestData);

  // Send email via Resend
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html,
    });

    if (error) {
      return { status: 'failed', error: error.message };
    }

    return { status: 'sent' };
  } catch (error) {
    return {
      status: 'failed',
      error: `Resend error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Build email subject based on digest content
 */
function buildSubject(data: DigestData): string {
  if (data.criticalTasks.length > 0) {
    return `Action Required: ${data.criticalTasks.length} critical task${data.criticalTasks.length > 1 ? 's' : ''} need attention`;
  }
  if (data.overdueTasks.length > 0) {
    return `Overdue: ${data.overdueTasks.length} task${data.overdueTasks.length > 1 ? 's' : ''} past due date`;
  }
  if (data.dueTodayTasks.length > 0) {
    return `Today's Tasks: ${data.dueTodayTasks.length} due today`;
  }
  return 'Your Daily Action Center Digest';
}

/**
 * Build simple HTML email (placeholder until React Email template in 10-07)
 */
function buildEmailHtml(recipientName: string, data: DigestData): string {
  const sections: string[] = [];

  // Critical tasks section
  if (data.criticalTasks.length > 0) {
    const items = data.criticalTasks
      .map(t => `<li style="margin: 8px 0;">${escapeHtml(t.title)}${t.due_date ? ` <span style="color: #6B7280;">(Due: ${formatDate(t.due_date)})</span>` : ''}</li>`)
      .join('');
    sections.push(`
      <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #DC2626; font-size: 16px;">Critical Tasks (${data.criticalTasks.length})</h3>
        <ul style="margin: 0; padding-left: 20px;">${items}</ul>
      </div>
    `);
  }

  // Overdue tasks section
  if (data.overdueTasks.length > 0) {
    const items = data.overdueTasks
      .map(t => `<li style="margin: 8px 0;">${escapeHtml(t.title)}${t.due_date ? ` <span style="color: #6B7280;">(Due: ${formatDate(t.due_date)})</span>` : ''}</li>`)
      .join('');
    sections.push(`
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #EF4444; font-size: 16px;">Overdue (${data.overdueTasks.length})</h3>
        <ul style="margin: 0; padding-left: 20px;">${items}</ul>
      </div>
    `);
  }

  // Due today section
  if (data.dueTodayTasks.length > 0) {
    const items = data.dueTodayTasks
      .map(t => `<li style="margin: 8px 0;">${escapeHtml(t.title)}</li>`)
      .join('');
    sections.push(`
      <div style="background: #FFFBEB; border-left: 4px solid #D97706; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; color: #D97706; font-size: 16px;">Due Today (${data.dueTodayTasks.length})</h3>
        <ul style="margin: 0; padding-left: 20px;">${items}</ul>
      </div>
    `);
  }

  // Stats section
  const statsHtml = `
    <div style="background: #F3F4F6; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; color: #4B5563;">
        <strong>${data.stats.totalActive}</strong> active tasks &bull;
        <strong>${data.stats.completedThisWeek}</strong> completed this week
      </p>
    </div>
  `;

  // Dashboard URL (use environment variable or default)
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard.iaml.com';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #F9FAFB;">
      <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Hey ${escapeHtml(recipientName)},</h2>
        <p style="margin: 0 0 24px 0; color: #6B7280;">Here's what's on your plate today...</p>

        ${sections.join('')}

        ${statsHtml}

        <div style="margin-top: 24px; text-align: center;">
          <a href="${dashboardUrl}/dashboard/action-center" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Action Center</a>
        </div>
      </div>

      <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px;">
        You're receiving this because you have daily digest enabled in your notification settings.
      </p>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Response type
 */
interface DigestSendResponse {
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

/**
 * POST /api/digest/send
 */
export async function POST(request: NextRequest): Promise<NextResponse<DigestSendResponse>> {
  // Validate API key
  const apiKey = request.headers.get('x-api-key');
  if (!DIGEST_API_KEY || apiKey !== DIGEST_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    let body: { userId?: string; all?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Single user mode
    if (body.userId) {
      // Fetch user profile
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name, notification_daily_digest, notification_digest_time, timezone')
        .eq('id', body.userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const result = await sendDigestToUser(user as UserDigestProfile);

      return NextResponse.json({
        success: result.status !== 'failed',
        sent: result.status === 'sent' ? 1 : 0,
        skipped: result.status === 'skipped' ? 1 : 0,
        failed: result.status === 'failed' ? 1 : 0,
        error: result.error,
      });
    }

    // Batch mode (all eligible users)
    if (body.all) {
      // Get all users with daily digest enabled
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, notification_daily_digest, notification_digest_time, timezone')
        .eq('notification_daily_digest', true)
        .eq('is_active', true);

      if (usersError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        );
      }

      if (!users || users.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          skipped: 0,
          failed: 0,
        });
      }

      // Filter to users whose digest time matches current time
      const eligibleUsers = (users as UserDigestProfile[]).filter(user =>
        isDigestTime(user.notification_digest_time, user.timezone)
      );

      if (eligibleUsers.length === 0) {
        return NextResponse.json({
          success: true,
          sent: 0,
          skipped: users.length,
          failed: 0,
        });
      }

      // Process in batches with rate limiting
      const results = {
        sent: [] as string[],
        skipped: [] as Array<{ userId: string; reason: string }>,
        failed: [] as Array<{ userId: string; error: string }>,
      };

      for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
        const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async user => {
            const result = await sendDigestToUser(user);
            return { userId: user.id, ...result };
          })
        );

        // Collect results
        for (const result of batchResults) {
          if (result.status === 'sent') {
            results.sent.push(result.userId);
          } else if (result.status === 'skipped') {
            results.skipped.push({ userId: result.userId, reason: result.error || 'unknown' });
          } else {
            results.failed.push({ userId: result.userId, error: result.error || 'unknown' });
          }
        }

        // Delay before next batch (skip if last batch)
        if (i + BATCH_SIZE < eligibleUsers.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      return NextResponse.json({
        success: true,
        sent: results.sent.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
        details: results,
      });
    }

    // Invalid request
    return NextResponse.json(
      { success: false, error: 'Request body must contain "userId" or "all: true"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Digest send error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
