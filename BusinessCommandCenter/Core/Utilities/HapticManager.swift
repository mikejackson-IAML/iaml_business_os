import UIKit
import SwiftUI

/// Centralized haptic feedback manager.
/// Provides both imperative methods (for non-SwiftUI code) and declarative triggers (for SwiftUI).
/// Pre-prepares generators for minimal latency on first tap.
final class HapticManager {
    static let shared = HapticManager()

    // MARK: - Impact Generators (pre-prepared for low latency)

    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let impactSoft = UIImpactFeedbackGenerator(style: .soft)
    private let impactRigid = UIImpactFeedbackGenerator(style: .rigid)

    // MARK: - Notification Generator

    private let notification = UINotificationFeedbackGenerator()

    // MARK: - Selection Generator

    private let selection = UISelectionFeedbackGenerator()

    // MARK: - Initialization

    private init() {
        prepare()
    }

    /// Pre-prepares all generators for low-latency feedback
    func prepare() {
        impactLight.prepare()
        impactMedium.prepare()
        impactHeavy.prepare()
        impactSoft.prepare()
        impactRigid.prepare()
        notification.prepare()
        selection.prepare()
    }

    // MARK: - Impact Feedback

    /// Triggers impact feedback with specified style
    /// - Parameter style: The impact style (light, medium, heavy, soft, rigid)
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        switch style {
        case .light:
            impactLight.impactOccurred()
        case .medium:
            impactMedium.impactOccurred()
        case .heavy:
            impactHeavy.impactOccurred()
        case .soft:
            impactSoft.impactOccurred()
        case .rigid:
            impactRigid.impactOccurred()
        @unknown default:
            impactMedium.impactOccurred()
        }
    }

    /// Light tap - for subtle interactions (toggle, small button)
    func tap() {
        impactLight.impactOccurred()
    }

    /// Medium impact - for standard button presses
    func button() {
        impactMedium.impactOccurred()
    }

    /// Heavy impact - for significant actions (confirm, submit)
    func action() {
        impactHeavy.impactOccurred()
    }

    // MARK: - Notification Feedback

    /// Triggers notification feedback for outcomes
    /// - Parameter type: success, warning, or error
    func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notification.notificationOccurred(type)
    }

    /// Success feedback - task completed successfully
    func success() {
        notification.notificationOccurred(.success)
    }

    /// Warning feedback - something needs attention
    func warning() {
        notification.notificationOccurred(.warning)
    }

    /// Error feedback - something went wrong
    func error() {
        notification.notificationOccurred(.error)
    }

    // MARK: - Selection Feedback

    /// Selection changed feedback - for pickers, scrolling selections
    func selectionChanged() {
        selection.selectionChanged()
    }
}

// MARK: - SwiftUI Modifiers

extension View {
    /// Adds haptic feedback on tap gesture
    func hapticOnTap(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) -> some View {
        self.simultaneousGesture(
            TapGesture().onEnded { _ in
                HapticManager.shared.impact(style)
            }
        )
    }
}

// MARK: - Haptic Feedback Types (for documentation)

/*
 Usage Guidelines:

 IMPACT FEEDBACK:
 - .light: Toggle switches, small buttons, list item selection
 - .medium: Standard buttons, tab changes, navigation
 - .heavy: Confirm dialogs, form submission, significant actions
 - .soft: Subtle confirmations, background actions completing
 - .rigid: Hard stops, reaching limits, errors

 NOTIFICATION FEEDBACK:
 - .success: Task completed, auth successful, data saved
 - .warning: Approaching limit, needs attention
 - .error: Authentication failed, validation error, network error

 SELECTION FEEDBACK:
 - Tab bar selection
 - Picker value changes
 - Scrolling through list items
*/
