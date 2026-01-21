import SwiftUI

// MARK: - Toast Modifier

/// A view modifier that displays a toast notification at the bottom of the screen.
/// The toast auto-dismisses after 2 seconds with smooth animation.
struct ToastModifier: ViewModifier {
    @Binding var toast: Toast?

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .bottom) {
                if let toast {
                    ToastView(toast: toast)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .padding(.bottom, 100) // Clear tab bar
                        .onAppear {
                            Task {
                                try? await Task.sleep(for: .seconds(2))
                                withAnimation {
                                    self.toast = nil
                                }
                            }
                        }
                }
            }
            .animation(.spring(duration: 0.3), value: toast)
    }
}

// MARK: - View Extension

extension View {
    /// Displays a toast notification at the bottom of the view.
    /// - Parameter toast: Binding to the optional toast to display.
    ///   Set to a Toast value to show, set to nil to dismiss.
    func toast(_ toast: Binding<Toast?>) -> some View {
        modifier(ToastModifier(toast: toast))
    }
}

// MARK: - Preview

#Preview("Toast Modifier Demo") {
    struct PreviewWrapper: View {
        @State private var toast: Toast?

        var body: some View {
            VStack(spacing: 20) {
                Button("Show Success") {
                    toast = Toast(message: "Workflow triggered!", type: .success)
                }

                Button("Show Error") {
                    toast = Toast(message: "Failed to trigger workflow", type: .error)
                }

                Button("Show Info") {
                    toast = Toast(message: "Checking system health...", type: .info)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .toast($toast)
        }
    }

    return PreviewWrapper()
}
