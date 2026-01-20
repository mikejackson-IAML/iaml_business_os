import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            VStack {
                Image(systemName: "chart.bar.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.secondary)
                Text("Dashboard")
                    .font(.title)
                Text("Health scores will appear here")
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Home")
        }
    }
}

#Preview {
    HomeView()
}
