import Foundation

/// Manages auto-lock timing using timestamp comparison.
/// iOS kills background timers, so we record timestamp when going to background
/// and compare elapsed time when returning to foreground.
final class LockManager {
    static let shared = LockManager()

    /// Lock timeout in seconds (5 minutes per AUTH-03)
    private let lockTimeout: TimeInterval = Constants.Security.lockTimeout

    /// Timestamp when app last went to background
    private var backgroundTimestamp: Date?

    /// Timestamp of last user activity
    private var lastActivityTimestamp: Date?

    private init() {}

    // MARK: - Background/Foreground Tracking

    /// Called when app goes to background
    func recordBackgroundTime() {
        backgroundTimestamp = Date()
    }

    /// Checks if app should lock based on time in background
    /// - Returns: true if should lock, false otherwise
    func shouldLockAfterBackground() -> Bool {
        guard let backgroundTime = backgroundTimestamp else {
            // No background timestamp means first launch - should be locked
            return true
        }

        let elapsed = Date().timeIntervalSince(backgroundTime)
        return elapsed >= lockTimeout
    }

    // MARK: - Activity Tracking

    /// Records user activity to reset inactivity timer
    func recordActivity() {
        lastActivityTimestamp = Date()
    }

    /// Checks if app should lock based on inactivity
    /// - Returns: true if should lock, false otherwise
    func shouldLockDueToInactivity() -> Bool {
        guard let lastActivity = lastActivityTimestamp else {
            return false // No activity tracked yet
        }

        let elapsed = Date().timeIntervalSince(lastActivity)
        return elapsed >= lockTimeout
    }

    // MARK: - Reset

    /// Resets all timestamps (called on unlock)
    func reset() {
        backgroundTimestamp = nil
        lastActivityTimestamp = Date()
    }

    // MARK: - Info

    /// Remaining time before auto-lock (for UI display if needed)
    var remainingLockTime: TimeInterval? {
        guard let lastActivity = lastActivityTimestamp else {
            return nil
        }

        let elapsed = Date().timeIntervalSince(lastActivity)
        let remaining = lockTimeout - elapsed
        return remaining > 0 ? remaining : 0
    }
}
