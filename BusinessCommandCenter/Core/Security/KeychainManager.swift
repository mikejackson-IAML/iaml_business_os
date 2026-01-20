import Foundation
import Security
import LocalAuthentication

/// Manages secure storage of API keys in iOS Keychain with biometric protection.
/// Keys are stored with kSecAttrAccessibleWhenUnlockedThisDeviceOnly and .biometryCurrentSet
/// which means:
/// - Key only accessible when device is unlocked
/// - Key invalidated if biometrics change (Face ID re-enrolled)
/// - Key never backed up to iCloud
final class KeychainManager {
    static let shared = KeychainManager()

    private let apiKeyAccount = "com.iaml.businesscommandcenter.apikey"
    private let serviceName = "BusinessCommandCenter"

    private init() {}

    // MARK: - Save API Key

    /// Saves API key to Keychain with biometric protection
    /// - Parameter apiKey: The API key to store
    /// - Throws: KeychainError if save fails
    func saveAPIKey(_ apiKey: String) throws {
        guard let data = apiKey.data(using: .utf8) else {
            throw KeychainError.encodingFailed
        }

        // Create access control requiring biometric authentication
        var accessError: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            &accessError
        ) else {
            throw KeychainError.accessControlFailed(accessError?.takeRetainedValue())
        }

        // Delete any existing key first
        try? deleteAPIKey()

        // Build query for new item
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: apiKeyAccount,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: access
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    // MARK: - Get API Key

    /// Retrieves API key from Keychain (will trigger biometric prompt)
    /// - Parameter context: Optional LAContext for pre-authenticated access
    /// - Returns: The stored API key, or nil if not found
    /// - Throws: KeychainError if retrieval fails
    func getAPIKey(context: LAContext? = nil) throws -> String? {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: apiKeyAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        // Use provided context for pre-authenticated access
        if let context = context {
            query[kSecUseAuthenticationContext as String] = context
        }

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        switch status {
        case errSecSuccess:
            guard let data = result as? Data,
                  let apiKey = String(data: data, encoding: .utf8) else {
                throw KeychainError.decodingFailed
            }
            return apiKey

        case errSecItemNotFound:
            return nil

        case errSecUserCanceled:
            throw KeychainError.userCanceled

        case errSecAuthFailed:
            throw KeychainError.authenticationFailed

        default:
            throw KeychainError.retrievalFailed(status)
        }
    }

    // MARK: - Delete API Key

    /// Deletes API key from Keychain
    func deleteAPIKey() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: apiKeyAccount
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }

    // MARK: - Check if Key Exists

    /// Checks if an API key is stored (without triggering biometric)
    func hasAPIKey() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: apiKeyAccount,
            kSecUseAuthenticationUI as String: kSecUseAuthenticationUIFail
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        // errSecInteractionNotAllowed means item exists but needs auth
        return status == errSecSuccess || status == errSecInteractionNotAllowed
    }
}

// MARK: - Keychain Errors

enum KeychainError: LocalizedError {
    case encodingFailed
    case decodingFailed
    case accessControlFailed(CFError?)
    case saveFailed(OSStatus)
    case retrievalFailed(OSStatus)
    case deleteFailed(OSStatus)
    case userCanceled
    case authenticationFailed

    var errorDescription: String? {
        switch self {
        case .encodingFailed:
            return "Failed to encode API key"
        case .decodingFailed:
            return "Failed to decode API key"
        case .accessControlFailed(let error):
            return "Access control creation failed: \(error?.localizedDescription ?? "unknown")"
        case .saveFailed(let status):
            return "Failed to save to Keychain: \(status)"
        case .retrievalFailed(let status):
            return "Failed to retrieve from Keychain: \(status)"
        case .deleteFailed(let status):
            return "Failed to delete from Keychain: \(status)"
        case .userCanceled:
            return "Authentication was canceled"
        case .authenticationFailed:
            return "Authentication failed"
        }
    }
}
