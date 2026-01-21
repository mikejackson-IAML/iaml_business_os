import UIKit
import UserNotifications

/// App delegate for push notification handling.
/// Required because UNUserNotificationCenterDelegate must be set in willFinishLaunchingWithOptions.
final class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // CRITICAL: Must set delegate here, not in didFinishLaunching
        // Otherwise notification taps won't be received when launching from killed state
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Convert token to hex string
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        print("[Push] Device token received: \(token.prefix(16))...")

        // Store token for later registration (handled by PushNotificationService)
        NotificationCenter.default.post(
            name: .didReceiveDeviceToken,
            object: nil,
            userInfo: ["token": token]
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("[Push] Registration failed: \(error.localizedDescription)")
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {

    /// Called when notification arrives while app is in foreground.
    /// Returns presentation options to show banner even when app is open.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Show banner, play sound, and update badge even when app is open
        return [.banner, .badge, .sound]
    }

    /// Called when user taps a notification.
    /// Posts notification for deep link handling.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo

        print("[Push] Notification tapped: \(userInfo)")

        // Post for deep link handling (will be handled by AppState in Plan 03)
        await MainActor.run {
            NotificationCenter.default.post(
                name: .didTapNotification,
                object: nil,
                userInfo: userInfo
            )
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    /// Posted when device token is received from APNs
    static let didReceiveDeviceToken = Notification.Name("didReceiveDeviceToken")
    /// Posted when user taps a push notification
    static let didTapNotification = Notification.Name("didTapNotification")
}
