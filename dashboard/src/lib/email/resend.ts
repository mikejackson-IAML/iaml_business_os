/**
 * Resend Email Client
 *
 * Configured Resend instance for transactional email.
 * Used for daily digest emails and critical alert notifications.
 *
 * Environment variable: RESEND_API_KEY
 */

import { Resend } from "resend";

/**
 * Get the configured Resend client instance.
 * Returns null if RESEND_API_KEY is not set.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "[Resend] RESEND_API_KEY not set. Email functionality will be disabled."
    );
    return null;
  }

  return new Resend(apiKey);
}

/**
 * Singleton Resend client instance.
 * Use this for most email operations.
 */
export const resend = getResendClient();

/**
 * Check if email is configured and available.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
