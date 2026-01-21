import SwiftUI

/// Individual message bubble for chat messages.
/// AI messages appear on the left with avatar, user messages appear on the right.
/// Timestamps are hidden by default and revealed on long-press.
struct MessageBubble: View {
    let message: ChatMessage
    @State private var showTimestamp = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if message.role == .assistant {
                AIAvatarView()
                assistantBubble
                Spacer(minLength: 60)
            } else {
                Spacer(minLength: 60)
                userBubble
            }
        }
        .onLongPressGesture {
            withAnimation(.easeInOut(duration: Constants.Animation.quick)) {
                showTimestamp.toggle()
            }
            HapticManager.shared.tap()
        }
    }

    // MARK: - Assistant Bubble

    private var assistantBubble: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(message.content)
                .font(.body)
                .textSelection(.enabled)

            if showTimestamp {
                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
    }

    // MARK: - User Bubble

    private var userBubble: some View {
        VStack(alignment: .trailing, spacing: 4) {
            Text(message.content)
                .font(.body)
                .foregroundStyle(.white)

            if showTimestamp {
                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(12)
        .background(Color.accentColor)
        .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
    }
}

#Preview("Assistant Message") {
    MessageBubble(message: .assistant("Hello! I'm your Business OS assistant. How can I help you today?"))
        .padding()
}

#Preview("User Message") {
    MessageBubble(message: .user("What's the current system health?"))
        .padding()
}
