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

    /// Error message to display
    var authError: String?

    /// Last time user interacted with the app
    var lastActiveTime: Date?

    /// Lock timeout in seconds (5 minutes)
    private let lockTimeout: TimeInterval = 5 * 60

    // MARK: - Lock Management

    /// Unlocks the app with authenticated context
    func unlock(with context: LAContext) {
        authContext = context
        isLocked = false
        recordActivity()
    }

    /// Locks the app
    func lock() {
        isLocked = true
        authContext = nil
    }

    /// Records user activity timestamp
    func recordActivity() {
        lastActiveTime = Date()
    }

    /// Checks if app should be locked based on inactivity
    func checkLockStatus() {
        guard !isLocked else { return }

        guard let lastActive = lastActiveTime else {
            lock()
            return
        }

        let elapsed = Date().timeIntervalSince(lastActive)
        if elapsed >= lockTimeout {
            lock()
        }
    }
}
