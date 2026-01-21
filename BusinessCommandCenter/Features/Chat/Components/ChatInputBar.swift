import SwiftUI

/// Floating capsule input bar for chat messages.
/// Features a prominent mic button (voice-first design) and expandable text field.
/// The mic button is always visible, keyboard appears when user taps to type.
struct ChatInputBar: View {
    @Binding var text: String
    @FocusState.Binding var isKeyboardFocused: Bool
    let isRecording: Bool
    let isStreaming: Bool
    let onSend: () -> Void
    let onMicTap: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Text field - shown when focused or has text
            if isKeyboardFocused || !text.isEmpty {
                TextField("Message...", text: $text, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...4)
                    .focused($isKeyboardFocused)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(.systemGray6))
                    .clipShape(Capsule())
                    .submitLabel(.send)
                    .onSubmit {
                        if canSend {
                            onSend()
                        }
                    }
            }

            // Mic button - always visible, prominent
            Button(action: onMicTap) {
                ZStack {
                    Circle()
                        .fill(isRecording ? Color.red : Color.accentColor)
                        .frame(width: 52, height: 52)

                    Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                        .font(.title2)
                        .foregroundStyle(.white)
                }
            }
            .disabled(isStreaming)
            .opacity(isStreaming ? 0.5 : 1)
            .animation(.easeInOut(duration: Constants.Animation.quick), value: isRecording)

            // Send button - only when text entered and not streaming
            if canSend && !isStreaming {
                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 36))
                        .foregroundStyle(Color.accentColor)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
        .animation(.easeInOut(duration: Constants.Animation.quick), value: text.isEmpty)
    }

    // MARK: - Helpers

    private var canSend: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

#Preview("Default State") {
    struct PreviewWrapper: View {
        @State var text = ""
        @FocusState var focused: Bool

        var body: some View {
            VStack {
                Spacer()
                ChatInputBar(
                    text: $text,
                    isKeyboardFocused: $focused,
                    isRecording: false,
                    isStreaming: false,
                    onSend: {},
                    onMicTap: {}
                )
            }
        }
    }
    return PreviewWrapper()
}

#Preview("With Text") {
    struct PreviewWrapper: View {
        @State var text = "Hello, what's the system status?"
        @FocusState var focused: Bool

        var body: some View {
            VStack {
                Spacer()
                ChatInputBar(
                    text: $text,
                    isKeyboardFocused: $focused,
                    isRecording: false,
                    isStreaming: false,
                    onSend: {},
                    onMicTap: {}
                )
            }
        }
    }
    return PreviewWrapper()
}

#Preview("Recording") {
    struct PreviewWrapper: View {
        @State var text = ""
        @FocusState var focused: Bool

        var body: some View {
            VStack {
                Spacer()
                ChatInputBar(
                    text: $text,
                    isKeyboardFocused: $focused,
                    isRecording: true,
                    isStreaming: false,
                    onSend: {},
                    onMicTap: {}
                )
            }
        }
    }
    return PreviewWrapper()
}
