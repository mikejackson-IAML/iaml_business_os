import SwiftUI

/// Ethereal pulsing indicator shown during voice recording
struct RecordingIndicator: View {
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.6
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            // Outer glow layers - create depth with multiple rings
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color.accentColor.opacity(0.4),
                                Color.accentColor.opacity(0)
                            ]),
                            center: .center,
                            startRadius: 20,
                            endRadius: 80
                        )
                    )
                    .frame(width: 160, height: 160)
                    .scaleEffect(scale + CGFloat(index) * 0.1)
                    .opacity(opacity - Double(index) * 0.15)
                    .rotationEffect(.degrees(rotation + Double(index * 120)))
            }

            // Inner pulsing ring
            Circle()
                .stroke(Color.accentColor.opacity(0.6), lineWidth: 3)
                .frame(width: 80, height: 80)
                .scaleEffect(scale)

            // Center mic icon
            Image(systemName: "mic.fill")
                .font(.system(size: 32))
                .foregroundStyle(.white)
                .shadow(color: .accentColor.opacity(0.8), radius: 10)
        }
        .onAppear {
            // Breathing pulse animation
            withAnimation(
                .easeInOut(duration: 2.0)
                .repeatForever(autoreverses: true)
            ) {
                scale = 1.15
                opacity = 0.8
            }

            // Slow rotation for ethereal feel
            withAnimation(
                .linear(duration: 8.0)
                .repeatForever(autoreverses: false)
            ) {
                rotation = 360
            }
        }
    }
}

#Preview {
    RecordingIndicator()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.8))
}
