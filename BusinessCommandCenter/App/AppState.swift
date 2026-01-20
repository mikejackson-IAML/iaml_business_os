import SwiftUI
import LocalAuthentication

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

    private let lockManager = LockManager.shared
    private let keychainManager = KeychainManager.shared

    init() {
        // Check if API key exists on init
        hasAPIKey = keychainManager.hasAPIKey()
    }

    // MARK: - Lock Management

    /// Unlocks the app with authenticated context
    func unlock(with context: LAContext) {
        authContext = context
        isLocked = false
        lockManager.reset()

        // Refresh API key status
        hasAPIKey = keychainManager.hasAPIKey()
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
}
