import SwiftUI

/// Displays AI response text as it streams in from the API.
/// Text fades in smoothly as new chunks arrive.
struct StreamingBubble: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            AIAvatarView()

            Text(text)
                .font(.body)
                .textSelection(.enabled)
                .padding(12)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
                // Animate opacity when text changes
                .animation(.easeIn(duration: Constants.Animation.quick), value: text)

            Spacer(minLength: 60)
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        StreamingBubble(text: "Hello!")
        StreamingBubble(text: "Hello! I'm your Business OS assistant.")
        StreamingBubble(text: "Hello! I'm your Business OS assistant. How can I help you today?")
    }
    .padding()
}
