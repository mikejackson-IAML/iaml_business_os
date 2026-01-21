import SwiftUI

/// Pre-permission screen shown before the iOS system notification prompt.
/// Explains the benefits of enabling notifications to improve conversion.
struct NotificationPermissionSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onComplete: (Bool) -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Icon
                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.blue)
                    .padding(.top, 40)

                // Title
                Text("Stay Informed")
                    .font(.title2)
                    .fontWeight(.bold)

                // Benefits list
                VStack(alignment: .leading, spacing: 16) {
                    benefitRow(
                        icon: "exclamationmark.triangle.fill",
                        color: .red,
                        title: "Critical Alerts",
                        subtitle: "Know immediately when systems need attention"
                    )

                    benefitRow(
                        icon: "checkmark.circle.fill",
                        color: .green,
                        title: "Workflow Updates",
                        subtitle: "Get notified when triggered workflows complete"
                    )

                    benefitRow(
                        icon: "sun.max.fill",
                        color: .orange,
                        title: "Daily Digest",
                        subtitle: "Morning summary of overnight activity"
                    )
                }
                .padding(.horizontal)

                Spacer()

                // Enable button
                Button {
                    HapticManager.shared.button()
                    Task {
                        let granted = await PushNotificationService.shared.requestPermission()
                        onComplete(granted)
                        dismiss()
                    }
                } label: {
                    Text("Enable Notifications")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding(.horizontal)

                // Skip button
                Button("Not Now") {
                    HapticManager.shared.tap()
                    onComplete(false)
                    dismiss()
                }
                .foregroundStyle(.secondary)
                .padding(.bottom, 20)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        onComplete(false)
                        dismiss()
                    }
                }
            }
        }
    }

    // MARK: - Components

    private func benefitRow(
        icon: String,
        color: Color,
        title: String,
        subtitle: String
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.title3)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    NotificationPermissionSheet { granted in
        print("Permission granted: \(granted)")
    }
}
