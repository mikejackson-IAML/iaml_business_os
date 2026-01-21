import SwiftUI

/// Circular avatar displayed alongside AI assistant messages.
/// Falls back to a styled placeholder if the ai-avatar image asset is not found.
struct AIAvatarView: View {
    var body: some View {
        Image("ai-avatar")
            .resizable()
            .scaledToFill()
            .frame(width: 36, height: 36)
            .clipShape(Circle())
            .overlay {
                Circle()
                    .stroke(Color.accentColor.opacity(0.2), lineWidth: 1)
            }
            .background {
                // Fallback if image not found
                Circle()
                    .fill(Color.accentColor.opacity(0.1))
                    .overlay {
                        Image(systemName: "brain.head.profile")
                            .font(.system(size: 18))
                            .foregroundStyle(.accentColor)
                    }
            }
    }
}

#Preview {
    AIAvatarView()
        .padding()
}
