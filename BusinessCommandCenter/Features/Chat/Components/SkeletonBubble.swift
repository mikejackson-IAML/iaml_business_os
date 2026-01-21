import SwiftUI

/// Shimmer placeholder shown while waiting for the AI's first response token.
/// Displays animated skeleton lines that shimmer to indicate loading state.
struct SkeletonBubble: View {
    @State private var shimmerOffset: CGFloat = -200

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // AI Avatar placeholder
            Circle()
                .fill(Color(.systemGray5))
                .frame(width: 36, height: 36)

            // Skeleton lines
            VStack(alignment: .leading, spacing: 8) {
                skeletonLine(width: 200)
                skeletonLine(width: 160)
                skeletonLine(width: 120)
            }
            .padding(12)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
            .overlay {
                // Shimmer overlay
                RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                    .fill(
                        LinearGradient(
                            colors: [.clear, .white.opacity(0.4), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .offset(x: shimmerOffset)
                    .mask(
                        RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                    )
            }
            .clipped()

            Spacer()
        }
        .onAppear {
            withAnimation(
                .linear(duration: 1.5)
                .repeatForever(autoreverses: false)
            ) {
                shimmerOffset = 300
            }
        }
    }

    // MARK: - Skeleton Line

    private func skeletonLine(width: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 4)
            .fill(Color(.systemGray5))
            .frame(width: width, height: 12)
    }
}

#Preview {
    SkeletonBubble()
        .padding()
}
