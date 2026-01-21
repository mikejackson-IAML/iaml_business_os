import Foundation

/// User preferences for push notifications.
/// Stored locally via @AppStorage and synced to backend.
struct NotificationPreferences: Codable, Equatable {
    // MARK: - Notification Types

    /// Receive notifications for critical alerts (system down, payment failed)
    var criticalAlertsEnabled: Bool = true

    /// Receive notifications when triggered workflows complete
    var workflowCompletionsEnabled: Bool = true

    /// Receive daily digest summary notification
    var dailyDigestEnabled: Bool = true

    // MARK: - Quiet Hours

    /// Whether quiet hours are enabled
    var quietHoursEnabled: Bool = true

    /// Quiet hours start time (0-23 hour)
    var quietHoursStart: Int = 22  // 10pm

    /// Quiet hours end time (0-23 hour)
    var quietHoursEnd: Int = 7     // 7am

    // MARK: - Digest

    /// Hour of day to receive daily digest (0-23)
    var digestHour: Int = 8        // 8am
}

// MARK: - RawRepresentable for @AppStorage

extension NotificationPreferences: RawRepresentable {
    init?(rawValue: String) {
        guard let data = rawValue.data(using: .utf8),
              let result = try? JSONDecoder().decode(NotificationPreferences.self, from: data)
        else {
            return nil
        }
        self = result
    }

    var rawValue: String {
        guard let data = try? JSONEncoder().encode(self),
              let result = String(data: data, encoding: .utf8)
        else {
            return "{}"
        }
        return result
    }
}

// MARK: - Backend Request

/// Request body for updating notification preferences on backend.
struct UpdatePreferencesRequest: Encodable {
    let device_token: String
    let quiet_hours_enabled: Bool
    let quiet_hours_start: Int
    let quiet_hours_end: Int
    let digest_enabled: Bool
    let digest_hour: Int
    let timezone: String

    init(token: String, preferences: NotificationPreferences) {
        self.device_token = token
        self.quiet_hours_enabled = preferences.quietHoursEnabled
        self.quiet_hours_start = preferences.quietHoursStart
        self.quiet_hours_end = preferences.quietHoursEnd
        self.digest_enabled = preferences.dailyDigestEnabled
        self.digest_hour = preferences.digestHour
        self.timezone = TimeZone.current.identifier
    }
}
