import Foundation

/// App-wide constants and configuration.
/// Centralizes magic numbers and strings for maintainability.
enum Constants {
    // MARK: - Security

    enum Security {
        /// Auto-lock timeout in seconds (5 minutes)
        static let lockTimeout: TimeInterval = 5 * 60

        /// Keychain service identifier
        static let keychainService = "BusinessCommandCenter"

        /// Keychain account for API key
        static let keychainAPIKeyAccount = "com.iaml.businesscommandcenter.apikey"
    }

    // MARK: - UI

    enum UI {
        /// Standard corner radius for cards and buttons
        static let cornerRadius: CGFloat = 12

        /// Large corner radius for sheets and modals
        static let cornerRadiusLarge: CGFloat = 20

        /// Standard padding
        static let padding: CGFloat = 16

        /// Large padding for section spacing
        static let paddingLarge: CGFloat = 24

        /// Minimum touch target size (Apple HIG)
        static let minTouchTarget: CGFloat = 44
    }

    // MARK: - Animation

    enum Animation {
        /// Standard animation duration
        static let standard: Double = 0.3

        /// Quick animation duration
        static let quick: Double = 0.15

        /// Slow animation duration
        static let slow: Double = 0.5
    }

    // MARK: - API

    enum API {
        /// API base URL (Next.js backend)
        static let baseURL = "https://api.iaml.io/mobile"

        /// Request timeout in seconds
        static let timeout: TimeInterval = 30
    }

    // MARK: - App Info

    enum App {
        /// App version from bundle
        static var version: String {
            Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
        }

        /// Build number from bundle
        static var build: String {
            Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
        }
    }
}
