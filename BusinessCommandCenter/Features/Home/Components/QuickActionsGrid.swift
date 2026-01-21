import SwiftUI
import LocalAuthentication

/// A 2x3 grid of quick action buttons that trigger n8n workflows.
struct QuickActionsGrid: View {
    @StateObject private var viewModel = QuickActionsViewModel()
    let context: LAContext

    /// Two-column grid layout
    private let columns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header
            Text("Quick Actions")
                .font(.headline)
                .padding(.horizontal)

            if viewModel.isLoading && viewModel.actions.isEmpty {
                loadingGrid
            } else if viewModel.actions.isEmpty {
                emptyState
            } else {
                actionsGrid
            }
        }
        .task {
            await viewModel.loadActions(context: context)
        }
        .alert(
            "Run \(viewModel.confirmationAction?.name ?? "Workflow")?",
            isPresented: .constant(viewModel.confirmationAction != nil)
        ) {
            Button("Cancel", role: .cancel) {
                viewModel.cancelConfirmation()
            }
            Button(
                viewModel.confirmationAction?.riskLevel == .destructive ? "Run Anyway" : "Run",
                role: viewModel.confirmationAction?.riskLevel == .destructive ? .destructive : nil
            ) {
                Task {
                    await viewModel.confirmAndTrigger(context: context)
                }
            }
        } message: {
            if viewModel.confirmationAction?.riskLevel == .destructive {
                Text("This action may make permanent changes.")
            } else {
                Text("This action may make changes.")
            }
        }
        .toast($viewModel.toast)
        .sheet(isPresented: $viewModel.showPermissionSheet) {
            NotificationPermissionSheet { granted in
                viewModel.handlePermissionResult(granted: granted, context: context)
            }
        }
    }

    // MARK: - Grid Content

    private var actionsGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(viewModel.actions) { action in
                QuickActionButton(
                    action: action,
                    isLoading: viewModel.loadingActionId == action.id,
                    onTap: {
                        Task {
                            await viewModel.triggerAction(action, context: context)
                        }
                    }
                )
            }
        }
        .padding(.horizontal)
    }

    private var loadingGrid: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(0..<6, id: \.self) { _ in
                RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                    .fill(Color(.systemBackground))
                    .frame(height: 80)
                    .overlay {
                        ProgressView()
                    }
            }
        }
        .padding(.horizontal)
    }

    private var emptyState: some View {
        HStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "bolt.slash")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                Text("No quick actions available")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 24)
            Spacer()
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
        .padding(.horizontal)
    }
}

// MARK: - Quick Action Button

/// Individual button in the quick actions grid.
private struct QuickActionButton: View {
    let action: QuickAction
    let isLoading: Bool
    let onTap: () -> Void

    @State private var isPressed = false

    /// Color based on risk level
    private var iconColor: Color {
        switch action.riskLevel {
        case .safe:
            return .blue
        case .risky:
            return .orange
        case .destructive:
            return .red
        }
    }

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .frame(width: 28, height: 28)
                } else {
                    Image(systemName: action.icon)
                        .font(.title2)
                        .foregroundStyle(iconColor)
                        .frame(width: 28, height: 28)
                }

                Text(action.name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: isPressed)
        }
        .buttonStyle(.plain)
        .disabled(isLoading || !action.canTrigger)
        .opacity(action.canTrigger ? 1.0 : 0.5)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

// MARK: - Preview

#Preview("Quick Actions Grid") {
    let context = LAContext()
    return ScrollView {
        QuickActionsGrid(context: context)
    }
    .background(Color(.systemGroupedBackground))
}
