import Foundation
import LocalAuthentication

/// Handles biometric authentication using Face ID or Touch ID.
/// Uses async/await API introduced in iOS 15 for cleaner error handling.
final class BiometricAuth {

    // MARK: - Biometry Type

    /// Returns the type of biometric authentication available
    var biometryType: BiometryType {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }

        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        case .opticID:
            return .opticID
        case .none:
            return .none
        @unknown default:
            return .none
        }
    }

    /// Human-readable name for the biometry type
    var biometryName: String {
        switch biometryType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .opticID:
            return "Optic ID"
        case .none:
            return "Passcode"
        }
    }

    /// SF Symbol name for the biometry type
    var biometryIcon: String {
        switch biometryType {
        case .faceID:
            return "faceid"
        case .touchID:
            return "touchid"
        case .opticID:
            return "opticid"
        case .none:
            return "lock"
        }
    }

    // MARK: - Check Availability

    /// Checks if biometric authentication is available
    func canAuthenticate() -> Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    // MARK: - Authenticate

    /// Performs biometric authentication
    /// - Parameter reason: Localized reason shown to user
    /// - Returns: LAContext if successful (can be used for Keychain access)
    /// - Throws: BiometricError if authentication fails
    func authenticate(reason: String = "Unlock your Business Command Center") async throws -> LAContext {
        let context = LAContext()
        context.localizedCancelTitle = "Cancel"

        var error: NSError?

        // Check if biometrics are available
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            if let laError = error as? LAError {
                throw mapLAError(laError)
            }
            throw BiometricError.notAvailable
        }

        // Perform authentication
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )

            if success {
                return context
            } else {
                throw BiometricError.failed
            }
        } catch let laError as LAError {
            throw mapLAError(laError)
        }
    }

    /// Performs authentication with device passcode fallback
    /// - Parameter reason: Localized reason shown to user
    /// - Returns: LAContext if successful
    /// - Throws: BiometricError if authentication fails
    func authenticateWithPasscodeFallback(reason: String = "Unlock your Business Command Center") async throws -> LAContext {
        let context = LAContext()
        context.localizedCancelTitle = "Cancel"

        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,  // Allows passcode fallback
                localizedReason: reason
            )

            if success {
                return context
            } else {
                throw BiometricError.failed
            }
        } catch let laError as LAError {
            throw mapLAError(laError)
        }
    }

    // MARK: - Error Mapping

    private func mapLAError(_ error: LAError) -> BiometricError {
        switch error.code {
        case .userCancel:
            return .userCanceled
        case .systemCancel:
            return .systemCanceled
        case .biometryNotAvailable:
            return .notAvailable
        case .biometryNotEnrolled:
            return .notEnrolled
        case .biometryLockout:
            return .lockout
        case .authenticationFailed:
            return .failed
        case .passcodeNotSet:
            return .passcodeNotSet
        case .userFallback:
            return .userFallback
        default:
            return .unknown(error.localizedDescription)
        }
    }
}

// MARK: - Supporting Types

enum BiometryType {
    case faceID
    case touchID
    case opticID
    case none
}

enum BiometricError: LocalizedError {
    case notAvailable
    case notEnrolled
    case lockout
    case userCanceled
    case systemCanceled
    case failed
    case passcodeNotSet
    case userFallback
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available on this device"
        case .notEnrolled:
            return "No biometrics are enrolled. Please set up Face ID or Touch ID in Settings."
        case .lockout:
            return "Biometric authentication is locked. Please use your device passcode."
        case .userCanceled:
            return nil  // User intentionally canceled, no error message needed
        case .systemCanceled:
            return nil  // System canceled (e.g., app went to background), no error needed
        case .failed:
            return "Authentication failed. Please try again."
        case .passcodeNotSet:
            return "Please set a device passcode in Settings to use this app."
        case .userFallback:
            return nil  // User chose to enter passcode instead
        case .unknown(let message):
            return message
        }
    }

    /// Whether this error should be shown to the user
    var shouldShowAlert: Bool {
        switch self {
        case .userCanceled, .systemCanceled, .userFallback:
            return false
        default:
            return true
        }
    }
}
