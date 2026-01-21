import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @StateObject private var viewModel = HomeViewModel()
    @State private var showAlerts = false

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Home")
                .refreshable {
                    guard let context = appState.authContext else { return }
                    await viewModel.refresh(context: context)
                    HapticManager.shared.success()
                }
                .task {
                    guard let context = appState.authContext else { return }
                    await viewModel.loadHealth(context: context)
                }
                .sheet(isPresented: $showAlerts) {
                    if let health = viewModel.healthData {
                        AlertsView(alerts: health.alerts)
                    }
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if viewModel.isLoading && !viewModel.hasData {
            loadingView
        } else if let error = viewModel.error, !viewModel.hasData {
            errorView(error)
        } else if let health = viewModel.healthData {
            healthDashboard(health)
        } else {
            emptyView
        }
    }

    // MARK: - Loading State

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading health data...")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error State

    private func errorView(_ error: NetworkError) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundStyle(.orange)

            Text("Unable to Load Data")
                .font(.title2)
                .fontWeight(.semibold)

            Text(error.localizedDescription)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            if error.shouldShowSettings {
                Button("Open Settings") {
                    // Navigate to Settings tab - handled by parent TabView
                    // For now, just clear error
                    viewModel.clearError()
                }
                .buttonStyle(.bordered)
            }

            Button("Retry") {
                Task {
                    guard let context = appState.authContext else { return }
                    await viewModel.loadHealth(context: context)
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Empty State

    private var emptyView: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.xaxis")
                .font(.system(size: 50))
                .foregroundStyle(.secondary)
            Text("No data available")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Health Dashboard

    private func healthDashboard(_ health: HealthResponse) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                // Overall health card
                HealthScoreCard(
                    score: health.overallHealth.score,
                    status: health.overallHealth.status
                )
                .frame(maxWidth: .infinity)

                // Alerts section (if any alerts exist)
                if health.totalAlertCount > 0 {
                    Button {
                        showAlerts = true
                        HapticManager.shared.tap()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Active Alerts")
                                    .font(.headline)
                                    .foregroundStyle(.primary)

                                Text("Tap to view details")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            AlertBadge(count: health.totalAlertCount, alerts: health.alerts)

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
                    }
                    .buttonStyle(.plain)
                }

                // Department list
                VStack(alignment: .leading, spacing: 8) {
                    Text("Departments")
                        .font(.headline)
                        .padding(.horizontal)

                    LazyVStack(spacing: 0) {
                        ForEach(health.departments) { department in
                            DepartmentHealthRow(department: department)
                                .padding(.horizontal)

                            if department.id != health.departments.last?.id {
                                Divider()
                                    .padding(.leading)
                            }
                        }
                    }
                    .background(Color(.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
                }

                // Last updated
                if let timestamp = formatTimestamp(health.timestamp) {
                    Text("Updated \(timestamp)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Helpers

    private func formatTimestamp(_ iso: String) -> String? {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) else { return nil }

        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .abbreviated
        return relative.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    HomeView()
        .environment(AppState())
}
