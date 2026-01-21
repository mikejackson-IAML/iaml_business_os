// Mobile Push Notification Send Endpoint
// Called by n8n workflows on completion and by system for critical alerts

import { NextRequest, NextResponse } from 'next/server';
import { sendToAllDevices } from '@/lib/api/notifications';
import type {
  SendNotificationRequest,
  SendNotificationResponse,
  NotificationPayload
} from '@/lib/types/notifications';

/**
 * POST /api/mobile/notifications/send
 * Sends a push notification to all registered devices
 *
 * Authentication:
 * - X-API-Key header (for mobile app internal use)
 * - X-Webhook-Secret header (for n8n workflow calls)
 *
 * Request body:
 * {
 *   type: 'workflow_complete' | 'critical_alert' | 'digest',
 *   title: string,
 *   body: string,
 *   data?: { workflow_id?, execution_id?, status?, alert_type?, deep_link? },
 *   critical?: boolean  // true = bypass quiet hours (for critical alerts)
 * }
 *
 * Response: { success: boolean, sent: number, failed: number, message?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<SendNotificationResponse | { error: string }>> {
  // Validate authentication (either API key or webhook secret)
  const apiKey = request.headers.get('X-API-Key');
  const webhookSecret = request.headers.get('X-Webhook-Secret');

  const validApiKey = process.env.MOBILE_API_KEY;
  const validWebhookSecret = process.env.N8N_WEBHOOK_SECRET;

  const isApiKeyValid = apiKey && validApiKey && apiKey === validApiKey;
  const isWebhookValid = webhookSecret && validWebhookSecret && webhookSecret === validWebhookSecret;

  if (!isApiKeyValid && !isWebhookValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: SendNotificationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate required fields
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'title is required' },
      { status: 400 }
    );
  }

  if (!body.body || typeof body.body !== 'string') {
    return NextResponse.json(
      { error: 'body is required' },
      { status: 400 }
    );
  }

  // Validate notification type
  const validTypes = ['workflow_complete', 'critical_alert', 'digest'];
  if (!body.type || !validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // Build notification payload
    const payload: NotificationPayload = {
      title: body.title,
      body: body.body,
      category: body.type.toUpperCase(),
      critical: body.critical || false,
    };

    // Add custom data if provided
    if (body.data) {
      payload.data = body.data;
    }

    // Determine if this is a critical notification
    // critical_alert type is always critical, others depend on explicit flag
    const isCritical = body.type === 'critical_alert' || body.critical === true;

    // Send to all devices
    const result = await sendToAllDevices(payload, isCritical);

    // Log notification for debugging
    console.log(`Notification sent: type=${body.type}, sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: result.skipped > 0
        ? `${result.skipped} device(s) skipped due to quiet hours`
        : undefined,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
