// Push Notification Types
// Shared interfaces for device registration and notification sending

// ==================== Device Registration ====================

export interface RegisterTokenRequest {
  device_token: string;
  device_name?: string;
  os_version?: string;
  app_version?: string;
  timezone?: string;  // IANA format: "America/Chicago"
}

export interface RegisterTokenResponse {
  success: boolean;
  message: string;
}

// ==================== Notification Sending ====================

export type NotificationType = 'workflow_complete' | 'critical_alert' | 'digest';

export interface SendNotificationRequest {
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
  critical?: boolean;  // Use critical alert (bypasses DND if entitlement approved)
}

export interface NotificationData {
  workflow_id?: string;
  execution_id?: string;
  status?: 'success' | 'failure';
  alert_type?: string;
  deep_link?: string;
  [key: string]: unknown;
}

export interface SendNotificationResponse {
  success: boolean;
  sent: number;
  failed: number;
  message?: string;
}

// ==================== Internal Types ====================

export interface NotificationPayload {
  title: string;
  body: string;
  badge?: number;
  data?: Record<string, unknown>;
  critical?: boolean;
  category?: string;
}

export interface DeviceToken {
  id: string;
  device_token: string;
  device_name: string | null;
  os_version: string | null;
  app_version: string | null;
  user_identifier: string;
  status: 'active' | 'bounced' | 'revoked';
  bounce_reason: string | null;
  bounced_at: string | null;
  timezone: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  digest_enabled: boolean;
  digest_hour: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

// ==================== Digest Types ====================

export interface DigestContent {
  unresolved_alerts: number;
  alerts_summary?: string;
  health_score: number;
  health_status: string;
  workflows_triggered: number;
  workflows_failed: number;
}

export interface DigestResponse {
  success: boolean;
  processed: number;
  sent: number;
}
