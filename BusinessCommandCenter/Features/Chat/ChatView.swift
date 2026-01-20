import SwiftUI

struct ChatView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Image(systemName: "bubble.left.and.bubble.right")
                    .font(.system(size: 60))
                    .foregroundStyle(.secondary)
                Text("AI Assistant")
                    .font(.title)
                Text("Chat interface will appear here")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Chat")
        }
    }
}

#Preview {
    ChatView()
}
