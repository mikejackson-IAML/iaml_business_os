// APNs Provider Singleton
// Manages HTTP/2 connection to Apple Push Notification service

import * as apn from '@parse/node-apn';

let provider: apn.Provider | null = null;

/**
 * Get or create the APNs provider singleton
 * Reuses connection across requests for efficiency
 */
export function getAPNsProvider(): apn.Provider {
  if (!provider) {
    const keyBase64 = process.env.APNS_KEY_BASE64;
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;

    if (!keyBase64 || !keyId || !teamId) {
      throw new Error('APNs credentials not configured. Set APNS_KEY_BASE64, APNS_KEY_ID, and APNS_TEAM_ID environment variables.');
    }

    provider = new apn.Provider({
      token: {
        key: Buffer.from(keyBase64, 'base64'),
        keyId,
        teamId,
      },
      production: process.env.NODE_ENV === 'production',
    });
  }
  return provider;
}

/**
 * Shutdown the APNs provider
 * Call on process exit if needed
 */
export function shutdownAPNsProvider(): void {
  if (provider) {
    provider.shutdown();
    provider = null;
  }
}

/**
 * Check if APNs is configured
 * Useful for graceful degradation when credentials missing
 */
export function isAPNsConfigured(): boolean {
  return !!(
    process.env.APNS_KEY_BASE64 &&
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID
  );
}
