/**
 * Send Digest Email
 *
 * Function to send the daily digest email to a user.
 * Handles fetching user profile, generating digest data, and sending via Resend.
 */

import { render } from '@react-email/components';
import { resend, isEmailConfigured } from './resend';
import { generateDigestData, hasUrgentItems } from './generate-digest-data';
import { DailyDigestEmail } from './templates/daily-digest';
import { getServerClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/types';

// ==================== Configuration ====================

/**
 * Email sender configuration
 * Uses environment variable or falls back to default
 */
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL || 'IAML Action Center <actioncenter@iamlcorp.com>';

/**
 * Default Action Center URL
 */
export const ACTION_CENTER_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL
    ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/dashboard/tasks`
    : 'https://dashboard.iamlcorp.com/dashboard/tasks';

// ==================== Types ====================

export interface SendDigestOptions {
  /** Override the action center URL */
  actionCenterUrl?: string;
  /** Force send even if no urgent items (useful for testing) */
  forceSend?: boolean;
}

export interface SendDigestResult {
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  messageId?: string;
  error?: string;
}

// ==================== Main Function ====================

/**
 * Send the daily digest email to a specific user
 *
 * @param userId - The user ID to send the digest to
 * @param options - Optional overrides and settings
 * @returns Result object with success/failure info
 */
export async function sendDigestEmail(
  userId: string,
  options: SendDigestOptions = {}
): Promise<SendDigestResult> {
  // Check if email is configured
  if (!isEmailConfigured() || !resend) {
    return {
      success: false,
      skipped: true,
      skipReason: 'Email not configured (RESEND_API_KEY not set)',
    };
  }

  try {
    // Fetch user profile
    const supabase = getServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        success: false,
        error: `Failed to fetch user profile: ${profileError.message}`,
      };
    }

    const userProfile = profile as Profile;

    // Check if user has daily digest enabled
    if (!userProfile.notification_daily_digest) {
      return {
        success: false,
        skipped: true,
        skipReason: 'User has daily digest notifications disabled',
      };
    }

    // Check if user is active
    if (!userProfile.is_active) {
      return {
        success: false,
        skipped: true,
        skipReason: 'User account is not active',
      };
    }

    // Generate digest data
    const digestData = await generateDigestData(userId);

    // Skip if nothing urgent (unless forceSend is true)
    if (!hasUrgentItems(digestData) && !options.forceSend) {
      return {
        success: true,
        skipped: true,
        skipReason: 'No critical, due today, or overdue tasks',
      };
    }

    // Get recipient name (fall back to email prefix if no name)
    const recipientName =
      userProfile.full_name || userProfile.email.split('@')[0];

    // Render the email template
    const emailHtml = await render(
      DailyDigestEmail({
        recipientName,
        criticalTasks: digestData.criticalTasks,
        dueTodayTasks: digestData.dueTodayTasks,
        overdueTasks: digestData.overdueTasks,
        stats: digestData.stats,
        actionCenterUrl: options.actionCenterUrl || ACTION_CENTER_URL,
      })
    );

    // Calculate total urgent for subject line
    const totalUrgent =
      digestData.criticalTasks.length +
      digestData.dueTodayTasks.length +
      digestData.overdueTasks.length;

    // Build subject line based on content
    let subject: string;
    if (digestData.criticalTasks.length > 0) {
      subject = `[Action Required] ${digestData.criticalTasks.length} critical task${digestData.criticalTasks.length !== 1 ? 's' : ''} need attention`;
    } else if (totalUrgent > 0) {
      subject = `Your Daily Digest: ${totalUrgent} item${totalUrgent !== 1 ? 's' : ''} need attention`;
    } else {
      subject = 'Your Daily Action Center Digest';
    }

    // Send the email
    const { data, error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: userProfile.email,
      subject,
      html: emailHtml,
    });

    if (sendError) {
      console.error('Error sending digest email:', sendError);
      return {
        success: false,
        error: `Failed to send email: ${sendError.message}`,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Unexpected error in sendDigestEmail:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
    };
  }
}

/**
 * Send digest emails to all users who have it enabled and are due for their digest
 *
 * This function should be called from a scheduled job (e.g., n8n workflow)
 * that runs every hour and filters users by their digest_time preference.
 *
 * @param digestHour - The hour (0-23) to filter users by their notification_digest_time
 * @returns Array of results for each user
 */
export async function sendDigestToAllDueUsers(
  digestHour: number
): Promise<{ userId: string; result: SendDigestResult }[]> {
  const supabase = getServerClient();

  // Format hour as HH:00:00 for comparison
  const digestTimeStr = `${digestHour.toString().padStart(2, '0')}:00:00`;

  // Fetch all active users with digest enabled at this hour
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users, error } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('is_active', true)
    .eq('notification_daily_digest', true)
    .eq('notification_digest_time', digestTimeStr);

  if (error) {
    console.error('Error fetching users for digest:', error);
    return [];
  }

  // Send digest to each user
  const results: { userId: string; result: SendDigestResult }[] = [];

  for (const user of users || []) {
    const result = await sendDigestEmail(user.id);
    results.push({ userId: user.id, result });
  }

  return results;
}
