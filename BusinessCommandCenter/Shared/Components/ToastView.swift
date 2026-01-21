import SwiftUI

// MARK: - Toast Type

/// Defines the visual style and semantic meaning of a toast notification.
enum ToastType {
    case success
    case error
    case info

    /// SF Symbol name for the toast icon
    var icon: String {
        switch self {
        case .success:
            return "checkmark.circle.fill"
        case .error:
            return "xmark.circle.fill"
        case .info:
            return "info.circle.fill"
        }
    }

    /// Semantic color for the toast icon
    var color: Color {
        switch self {
        case .success:
            return .green
        case .error:
            return .red
        case .info:
            return .blue
        }
    }
}

// MARK: - Toast Model

/// Represents a toast notification to display.
struct Toast: Identifiable, Equatable {
    let id: UUID
    let message: String
    let type: ToastType

    init(id: UUID = UUID(), message: String, type: ToastType) {
        self.id = id
        self.message = message
        self.type = type
    }

    static func == (lhs: Toast, rhs: Toast) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Toast View

/// A toast notification view that displays a brief message with an icon.
/// Positioned at the bottom of the screen and auto-dismisses after 2 seconds.
struct ToastView: View {
    let toast: Toast

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: toast.type.icon)
                .foregroundStyle(toast.type.color)
                .font(.body.weight(.semibold))

            Text(toast.message)
                .font(.body)
                .foregroundStyle(.primary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.regularMaterial)
        .clipShape(Capsule())
        .shadow(color: .black.opacity(0.15), radius: 8, y: 4)
        .onAppear {
            triggerHaptic()
        }
    }

    // MARK: - Haptic Feedback

    private func triggerHaptic() {
        switch toast.type {
        case .success:
            HapticManager.shared.success()
        case .error:
            HapticManager.shared.error()
        case .info:
            HapticManager.shared.tap()
        }
    }
}

// MARK: - Preview

#Preview("Success Toast") {
    ZStack {
        Color(.systemBackground)
        ToastView(toast: Toast(message: "Workflow triggered!", type: .success))
    }
}

#Preview("Error Toast") {
    ZStack {
        Color(.systemBackground)
        ToastView(toast: Toast(message: "Failed to trigger workflow", type: .error))
    }
}

#Preview("Info Toast") {
    ZStack {
        Color(.systemBackground)
        ToastView(toast: Toast(message: "Checking system health...", type: .info))
    }
}
