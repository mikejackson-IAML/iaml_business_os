import Foundation
import UserNotifications
import UIKit
import LocalAuthentication

/// Manages push notification permission, token registration, and state.
@MainActor
final class PushNotificationService: ObservableObject {
    static let shared = PushNotificationService()

    // MARK: - Published State

    /// Current authorization status
    @Published private(set) var permissionStatus: UNAuthorizationStatus = .notDetermined

    /// Whether we've already prompted for permission (stored in UserDefaults)
    @Published private(set) var hasPromptedForPermission: Bool

    /// Current device token (if registered)
    private(set) var currentToken: String?

    // MARK: - Private

    private let center = UNUserNotificationCenter.current()
    private let hasPromptedKey = "hasPromptedForNotificationPermission"

    // MARK: - Init

    private init() {
        hasPromptedForPermission = UserDefaults.standard.bool(forKey: hasPromptedKey)

        // Listen for device token from AppDelegate
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeviceToken),
            name: .didReceiveDeviceToken,
            object: nil
        )

        // Check current permission status
        Task {
            await refreshPermissionStatus()
        }
    }

    // MARK: - Public Methods

    /// Refreshes the current authorization status from the system.
    func refreshPermissionStatus() async {
        let settings = await center.notificationSettings()
        permissionStatus = settings.authorizationStatus
    }

    /// Checks if we should show the permission prompt.
    /// Returns true if: not yet prompted AND permission not yet determined.
    var shouldPromptForPermission: Bool {
        !hasPromptedForPermission && permissionStatus == .notDetermined
    }

    /// Requests notification permission.
    /// Call this after user dismisses pre-permission sheet (to show system prompt).
    /// - Returns: true if permission was granted
    func requestPermission() async -> Bool {
        // Mark that we've prompted (even if they decline the system prompt)
        hasPromptedForPermission = true
        UserDefaults.standard.set(true, forKey: hasPromptedKey)

        do {
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])

            if granted {
                // Register for remote notifications to get device token
                UIApplication.shared.registerForRemoteNotifications()
            }

            await refreshPermissionStatus()
            return granted
        } catch {
            print("[Push] Permission request error: \(error)")
            await refreshPermissionStatus()
            return false
        }
    }

    /// Registers the device token with the backend.
    /// Called automatically when token is received, but can be called again after auth is available.
    func registerTokenWithBackend(context: LAContext) async {
        guard let token = currentToken else {
            print("[Push] No token to register")
            return
        }

        do {
            try await NetworkManager.shared.registerDeviceToken(
                token: token,
                timezone: TimeZone.current.identifier,
                context: context
            )
            print("[Push] Token registered with backend")
        } catch {
            print("[Push] Token registration failed: \(error)")
        }
    }

    // MARK: - Private Methods

    @objc private func handleDeviceToken(_ notification: Notification) {
        guard let token = notification.userInfo?["token"] as? String else { return }
        currentToken = token
        print("[Push] Token stored: \(token.prefix(16))...")
    }
}
