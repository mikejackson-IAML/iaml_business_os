import SwiftUI
import LocalAuthentication

// MARK: - Deep Link Destination

/// Possible deep link destinations from notification taps.
enum DeepLinkDestination: Equatable {
    case home
    case homeWithAlerts  // Opens Home tab and alerts sheet
    case settings
}

/// Observable app state managing authentication and lock status.
/// Uses @Observable (iOS 17+) for automatic view updates.
@Observable
final class AppState {
    /// Whether the app is currently locked
    var isLocked = true

    /// LAContext from successful authentication (for Keychain access)
    var authContext: LAContext?

    /// Whether API key is configured
    var hasAPIKey = false

    /// Deep link destination from notification tap (nil when handled)
    var deepLinkDestination: DeepLinkDestination?

    /// Whether alerts sheet should be shown (lifted from HomeView for cross-view control)
    var showAlerts = false

    private let lockManager = LockManager.shared
    private let keychainManager = KeychainManager.shared

    init() {
        // Check if API key exists on init
        hasAPIKey = keychainManager.hasAPIKey()

        // Listen for notification taps from AppDelegate
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleNotificationTap),
            name: .didTapNotification,
            object: nil
        )
    }

    // MARK: - Lock Management

    /// Unlocks the app with authenticated context
    func unlock(with context: LAContext) {
        authContext = context
        isLocked = false
        lockManager.reset()

        // Refresh API key status
        hasAPIKey = keychainManager.hasAPIKey()

        // Handle any pending deep link after unlock
        processPendingDeepLink()
    }

    /// Locks the app
    func lock() {
        isLocked = true
        authContext = nil
    }

    // MARK: - Scene Phase Handling

    /// Called when app goes to background
    func handleBackground() {
        lockManager.recordBackgroundTime()
    }

    /// Called when app returns to active
    func handleActive() {
        guard !isLocked else { return }

        if lockManager.shouldLockAfterBackground() {
            lock()
        }
    }

    // MARK: - Activity Recording

    /// Records user activity (call on significant user interactions)
    func recordActivity() {
        lockManager.recordActivity()
    }

    // MARK: - API Key Status

    /// Refreshes API key status
    func refreshAPIKeyStatus() {
        hasAPIKey = keychainManager.hasAPIKey()
    }

    // MARK: - Deep Link Handling

    @objc private func handleNotificationTap(_ notification: Notification) {
        guard let userInfo = notification.userInfo else { return }

        // Extract notification type from userInfo
        let type = userInfo["type"] as? String ?? ""

        // Map notification type to destination
        switch type.uppercased() {
        case "CRITICAL_ALERT":
            deepLinkDestination = .homeWithAlerts
        case "WORKFLOW_COMPLETE", "DIGEST":
            deepLinkDestination = .home
        default:
            // Default to home for unknown types
            deepLinkDestination = .home
        }

        print("[DeepLink] Set destination: \(String(describing: deepLinkDestination))")
    }

    /// Process any pending deep link (called after unlock)
    private func processPendingDeepLink() {
        // Deep link will be handled by ContentView's onChange
        // This is called to ensure it processes after unlock
    }
}
