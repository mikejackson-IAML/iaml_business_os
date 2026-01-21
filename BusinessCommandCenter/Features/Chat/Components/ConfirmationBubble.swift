import SwiftUI

/// Inline confirmation bubble for high-risk actions.
/// Shows detailed preview with approve/reject buttons.
/// Displays as an AI message with context-specific action buttons.
struct ConfirmationBubble: View {
    let action: ConfirmationAction
    let onApprove: () -> Void
    let onReject: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // AI Avatar
            AIAvatarView()

            VStack(alignment: .leading, spacing: 12) {
                // Action description
                Text(action.description)
                    .font(.subheadline)
                    .fontWeight(.medium)

                // Details preview (if any)
                if !action.details.isEmpty {
                    detailsCard
                }

                // Action buttons
                HStack(spacing: 12) {
                    Button("Cancel", role: .cancel, action: onReject)
                        .buttonStyle(.bordered)

                    Button(action: onApprove) {
                        Text(action.confirmLabel)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(action.isDestructive ? .red : .accentColor)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
            .shadow(color: .black.opacity(0.1), radius: 4, y: 2)

            Spacer(minLength: 40)
        }
    }

    private var detailsCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            ForEach(action.details, id: \.key) { detail in
                HStack(alignment: .top) {
                    Text(detail.key + ":")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .frame(width: 80, alignment: .leading)
                    Text(detail.value)
                        .font(.caption)
                        .foregroundStyle(.primary)
                }
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        ConfirmationBubble(
            action: ConfirmationAction(
                toolId: "123",
                toolName: "trigger_workflow",
                description: "Run the \"Daily Report Generator\" workflow?",
                confirmLabel: "Run Workflow",
                isDestructive: false,
                details: [
                    .init(key: "Workflow", value: "Daily Report Generator"),
                    .init(key: "Schedule", value: "Immediate"),
                ]
            ),
            onApprove: { print("Approved") },
            onReject: { print("Rejected") }
        )

        ConfirmationBubble(
            action: ConfirmationAction(
                toolId: "456",
                toolName: "send_emails",
                description: "Send marketing email to 1,500 contacts?",
                confirmLabel: "Send Emails",
                isDestructive: true,
                details: [
                    .init(key: "Recipients", value: "1,500 contacts"),
                    .init(key: "Template", value: "Q1 Newsletter"),
                ]
            ),
            onApprove: { print("Approved") },
            onReject: { print("Rejected") }
        )
    }
    .padding()
}
