# Phase 7: Health API & Dashboard - Research

**Researched:** 2026-01-20
**Domain:** Next.js API routes, SwiftUI networking, health data aggregation
**Confidence:** HIGH

## Summary

This phase builds the connection between the iOS app and the business health data. The Next.js dashboard already has comprehensive health data infrastructure (Digital, Marketing, Programs, Workflow Health) that can be aggregated into a mobile-friendly endpoint. The API route will live at `/api/mobile/health`, use header-based API key authentication (distinct from the session-based web auth), and return a unified JSON response. The iOS app will use `URLSession` with async/await for networking and the built-in `.refreshable` modifier for pull-to-refresh.

The primary complexity lies in designing the health response format to be useful on mobile (smaller screens, limited data) while leveraging the existing health calculation logic. The existing `HealthScore` component in the dashboard-kit provides a proven model for what data fields the iOS UI will need.

**Primary recommendation:** Create a dedicated `/api/mobile/health` route that aggregates existing data sources (workflow health, digital metrics) and returns a flattened JSON response. Implement API key validation as a simple header check in the route handler. On iOS, create a `NetworkManager` singleton with URLSession, and display health cards in a `List` with `.refreshable`.

## 1. Existing Infrastructure

### Health Data Sources Available

| Source | Location | What It Provides |
|--------|----------|------------------|
| Workflow Health | `n8n_brain.workflow_runs` via RPCs | Success rate, error count, unresolved errors |
| Digital Metrics | `getSiteStatus()`, `getCoreWebVitals()` | Uptime %, LCP, error rate |
| Database Health | `getDatabaseMetrics()` | Storage %, connections, backup status |
| Security | `getSecurityMetrics()` | Vulnerabilities, SSL days, 5xx rate |

### Existing Dashboard Types

The dashboard already defines health-related types in `/dashboard/src/dashboard-kit/types/dashboard.ts`:

```typescript
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface SummaryCardData {
  id: string;
  label: string;
  value: string | number;
  status?: HealthStatus;
  // ...
}
```

### Existing Health Calculation Logic

The Digital Dashboard (`digital-content.tsx`) already calculates a composite health score:
- Uptime (25%)
- Registration Tests (25%)
- Performance/LCP (15%)
- Database Health (15%)
- Security (10%)
- No Critical Blockers (10%)

This logic can be extracted and reused for the mobile API.

### Data Queries Ready to Use

```typescript
// Workflow health - already in place
import { getWorkflowDashboardData } from '@/lib/api/workflow-queries';

// Digital metrics - already in place
import { getDigitalMetrics } from '@/lib/api/digital-queries';
```

## 2. API Architecture

### Endpoint Design

**Path:** `GET /api/mobile/health`

**Authentication:** Custom `X-API-Key` header (not session-based)

The mobile API uses a different auth model than the web dashboard:
- Web dashboard: Supabase session cookies
- Mobile API: API key in header (stored in iOS Keychain)

This is intentional - mobile apps should not share browser sessions.

### API Key Validation Pattern

```typescript
// dashboard/src/app/api/mobile/health/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Fetch and return health data
  // ...
}
```

### Middleware Consideration

The existing middleware (`dashboard/src/middleware.ts`) handles session auth for web routes. Mobile API routes should be **excluded** from session middleware since they use API key auth.

**Option 1:** Exclude `/api/mobile/*` from middleware matcher
**Option 2:** Handle API key auth in each route handler

Recommendation: Option 2 for simplicity - handle in route handler, not middleware.

### Response Format Recommendation

```typescript
interface MobileHealthResponse {
  timestamp: string;
  overallHealth: {
    score: number;          // 0-100
    status: HealthStatus;   // 'healthy' | 'warning' | 'critical'
  };
  departments: {
    id: string;
    name: string;
    score: number;
    status: HealthStatus;
    alertCount: number;
    topMetrics: {
      label: string;
      value: string;
      status: HealthStatus;
    }[];
  }[];
  alerts: {
    id: string;
    title: string;
    severity: 'info' | 'warning' | 'critical';
    department: string;
    timestamp: string;
  }[];
  totalAlertCount: number;
}
```

### Department Breakdown

| Department | Data Source | Key Metrics |
|------------|-------------|-------------|
| Digital | `getDigitalMetrics()` | Uptime, LCP, Error Rate |
| Workflows | `getWorkflowDashboardData()` | Success Rate, Unresolved Errors |
| Marketing | Campaigns table | Active Campaigns, Engagement Rate |
| Programs | Programs table | Upcoming Programs, Registration Count |

## 3. iOS Networking Patterns

### Standard Stack

| Component | Implementation | Why |
|-----------|----------------|-----|
| HTTP Client | URLSession.shared | Native, zero dependencies, async/await support |
| JSON Decoding | Codable + JSONDecoder | Native Swift, type-safe |
| Error Handling | Custom Error enum | Clear error types for UI display |

### NetworkManager Pattern

```swift
// Source: Apple Developer Documentation, Swift by Sundell
// https://developer.apple.com/documentation/foundation/urlsession
// https://www.swiftbysundell.com/articles/making-swiftui-views-refreshable/

import Foundation

actor NetworkManager {
    static let shared = NetworkManager()

    private let baseURL = URL(string: Constants.API.baseURL)!
    private let session = URLSession.shared

    func fetchHealth(apiKey: String) async throws -> HealthResponse {
        var request = URLRequest(url: baseURL.appendingPathComponent("health"))
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200:
            return try JSONDecoder().decode(HealthResponse.self, from: data)
        case 401:
            throw NetworkError.unauthorized
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.unexpectedStatus(httpResponse.statusCode)
        }
    }
}

enum NetworkError: Error, LocalizedError {
    case unauthorized
    case invalidResponse
    case serverError(Int)
    case unexpectedStatus(Int)
    case noAPIKey

    var errorDescription: String? {
        switch self {
        case .unauthorized: return "Invalid API key"
        case .invalidResponse: return "Invalid server response"
        case .serverError(let code): return "Server error (\(code))"
        case .unexpectedStatus(let code): return "Unexpected status (\(code))"
        case .noAPIKey: return "API key not configured"
        }
    }
}
```

### Async/Await Integration

Key patterns from [Swift by Sundell](https://www.swiftbysundell.com/articles/making-swiftui-views-refreshable/):

1. Use `actor` for thread-safe network manager
2. Use `@MainActor` on ViewModels for UI updates
3. Use `.task` modifier for initial load
4. Use `.refreshable` modifier for pull-to-refresh

```swift
// Source: Hacking with Swift
// https://www.hackingwithswift.com/quick-start/swiftui/how-to-enable-pull-to-refresh

struct HomeView: View {
    @State private var healthData: HealthResponse?
    @State private var isLoading = false
    @State private var error: Error?

    var body: some View {
        NavigationStack {
            List {
                // Content here
            }
            .refreshable {
                await loadHealth()
            }
            .task {
                await loadHealth()
            }
        }
    }

    @MainActor
    private func loadHealth() async {
        // Loading implementation
    }
}
```

## 4. Data Model Design

### Swift Models (iOS)

```swift
struct HealthResponse: Codable {
    let timestamp: String
    let overallHealth: OverallHealth
    let departments: [DepartmentHealth]
    let alerts: [HealthAlert]
    let totalAlertCount: Int
}

struct OverallHealth: Codable {
    let score: Int
    let status: HealthStatus
}

struct DepartmentHealth: Codable, Identifiable {
    let id: String
    let name: String
    let score: Int
    let status: HealthStatus
    let alertCount: Int
    let topMetrics: [TopMetric]
}

struct TopMetric: Codable, Identifiable {
    let id = UUID()
    let label: String
    let value: String
    let status: HealthStatus

    enum CodingKeys: String, CodingKey {
        case label, value, status
    }
}

struct HealthAlert: Codable, Identifiable {
    let id: String
    let title: String
    let severity: AlertSeverity
    let department: String
    let timestamp: String
}

enum HealthStatus: String, Codable {
    case healthy, warning, critical
}

enum AlertSeverity: String, Codable {
    case info, warning, critical
}
```

### JSON Example

```json
{
  "timestamp": "2026-01-20T15:30:00Z",
  "overallHealth": {
    "score": 87,
    "status": "healthy"
  },
  "departments": [
    {
      "id": "digital",
      "name": "Digital",
      "score": 92,
      "status": "healthy",
      "alertCount": 0,
      "topMetrics": [
        { "label": "Uptime", "value": "99.95%", "status": "healthy" },
        { "label": "LCP", "value": "1.8s", "status": "healthy" }
      ]
    },
    {
      "id": "workflows",
      "name": "Workflows",
      "score": 85,
      "status": "healthy",
      "alertCount": 2,
      "topMetrics": [
        { "label": "Success Rate", "value": "96%", "status": "healthy" },
        { "label": "Unresolved", "value": "2", "status": "warning" }
      ]
    }
  ],
  "alerts": [
    {
      "id": "wf-001",
      "title": "Domain Sync workflow failed",
      "severity": "warning",
      "department": "workflows",
      "timestamp": "2026-01-20T14:15:00Z"
    }
  ],
  "totalAlertCount": 2
}
```

## 5. Real-time Strategy

### Options Evaluated

| Strategy | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| Polling (30s) | Simple, works everywhere | Battery impact, unnecessary requests | **Use for v1** |
| WebSocket | True real-time | Complex, connection management | Defer to v2.1 |
| Server-Sent Events | Simpler than WS | iOS support limited | Not recommended |
| Push Notifications | Efficient, native | Requires APNs setup, different infra | Phase 12 |

### Recommendation: Polling with Smart Intervals

For v2.0, implement manual pull-to-refresh with optional auto-refresh:

1. **Initial load:** Fetch on app launch (after auth)
2. **Pull-to-refresh:** User-initiated with `.refreshable`
3. **Background refresh:** iOS background app refresh (if enabled)
4. **No continuous polling:** Battery-friendly

Auto-refresh can be added later as a user preference. The existing dashboard has `refreshIntervalSeconds` in its config - this pattern can be adopted.

## 6. SwiftUI Components

### Required Components

| Component | Purpose | Pattern |
|-----------|---------|---------|
| `HomeView` | Container with pull-to-refresh | `List` + `.refreshable` |
| `OverallHealthCard` | Top-level score display | Custom card with ring chart |
| `DepartmentHealthRow` | Per-department summary | `List` row with status indicator |
| `AlertBadge` | Alert count indicator | Badge on tab/card |
| `StatusIndicator` | Colored dot/icon | Reusable component |

### HealthScoreCard Pattern

Based on existing dashboard component (`health-score.tsx`):

```swift
struct HealthScoreCard: View {
    let score: Int
    let status: HealthStatus
    let label: String

    var body: some View {
        VStack(spacing: 12) {
            // Ring chart showing score
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 8)
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(statusColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Text("\(score)")
                    .font(.system(size: 36, weight: .bold, design: .rounded))
            }
            .frame(width: 100, height: 100)

            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var statusColor: Color {
        switch status {
        case .healthy: return .green
        case .warning: return .orange
        case .critical: return .red
        }
    }
}
```

### DepartmentRow Pattern

```swift
struct DepartmentHealthRow: View {
    let department: DepartmentHealth

    var body: some View {
        HStack {
            StatusIndicator(status: department.status)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(department.name)
                        .font(.headline)
                    if department.alertCount > 0 {
                        Text("\(department.alertCount)")
                            .font(.caption)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .foregroundColor(.white)
                            .clipShape(Capsule())
                    }
                }
                Text(department.topMetrics.map { "\($0.label): \($0.value)" }.joined(separator: " | "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text("\(department.score)")
                .font(.title2)
                .fontWeight(.semibold)
        }
        .padding(.vertical, 8)
    }
}
```

## 7. Key Decisions Needed

Choices the planner needs to make:

| Decision | Options | Recommendation |
|----------|---------|----------------|
| API key storage | Env var vs Supabase table | Env var (`MOBILE_API_KEY`) - simple, secure |
| Department list | Fixed vs configurable | Fixed for v1 (Digital, Workflows) |
| Alert tap action | Navigate vs sheet | Sheet with alert details |
| Auto-refresh | On vs off by default | Off - user enables in Settings |
| Cache strategy | Memory vs disk | Memory only for v1 |

## 8. Risks & Considerations

### API Rate Limiting

**Risk:** Excessive polling could hit rate limits on upstream APIs (Vercel, PageSpeed).

**Mitigation:**
- Cache responses server-side (5-minute TTL)
- Rate limit mobile endpoint (10 req/min per API key)
- Only fetch from upstream if cache expired

### Error Handling Consistency

**Risk:** Different error formats between upstream sources.

**Mitigation:** Normalize all errors in the API route before returning to mobile.

### API Key Security

**Risk:** API key compromised if device is stolen.

**Mitigation:**
- Key is in Keychain with biometric protection (Phase 6 done)
- Key can be rotated server-side without app update
- Consider key expiration in future version

### Network Failure UX

**Risk:** Poor experience when offline or API unavailable.

**Mitigation:**
- Show last-known data with "Last updated X minutes ago"
- Clear error messages ("Unable to connect" not "Error")
- Retry button in error state

### Large Response Size

**Risk:** Response too large for mobile data usage.

**Mitigation:**
- Keep `topMetrics` to 2-3 items per department
- Limit `alerts` to 10 most recent
- Consider compression header support

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pull-to-refresh | Custom gesture + spinner | `.refreshable` modifier | Native iOS behavior, accessibility |
| Loading spinner | Custom animation | `ProgressView()` | Native, adapts to system |
| Network requests | Combine/completion handlers | async/await URLSession | Cleaner code, native |
| JSON parsing | Manual dictionary parsing | Codable | Type-safe, automatic |
| Status colors | Manual color switching | Asset catalog semantic colors | Dark mode support |

## Common Pitfalls

### Pitfall 1: Blocking Main Thread with Network

**What goes wrong:** UI freezes during network request.
**Why it happens:** Not using async/await properly.
**How to avoid:** Use `@MainActor` only for UI updates, network on background.

### Pitfall 2: Memory Leak from Retained Self in Closures

**What goes wrong:** ViewModel not deallocated, stale data shown.
**Why it happens:** Strong reference to self in completion handlers.
**How to avoid:** async/await eliminates this - no closures needed.

### Pitfall 3: Duplicate Requests on Pull-to-Refresh

**What goes wrong:** Multiple simultaneous requests when user pulls repeatedly.
**Why it happens:** No debounce or in-progress check.
**How to avoid:** `.refreshable` automatically prevents duplicate refreshes.

### Pitfall 4: Hardcoded API URL

**What goes wrong:** Can't change URL without app store update.
**Why it happens:** URL in source code.
**How to avoid:** URL in Constants file, could add remote config later.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Alamofire for networking | URLSession async/await | iOS 15/Swift 5.5 | Zero dependencies |
| UIRefreshControl | `.refreshable` modifier | iOS 15 | Declarative, less code |
| Manual JSON parsing | Codable | Swift 4 | Type-safe |
| Completion handlers | async/await | Swift 5.5 | Linear code flow |

## Sources

### Primary (HIGH confidence)
- [Apple Developer - URLSession](https://developer.apple.com/documentation/foundation/urlsession) - Official URLSession API
- [Hacking with Swift - refreshable](https://www.hackingwithswift.com/quick-start/swiftui/how-to-enable-pull-to-refresh) - Pull-to-refresh pattern
- [Swift by Sundell - Refreshable Views](https://www.swiftbysundell.com/articles/making-swiftui-views-refreshable/) - Complete refresh pattern
- [Antoine van der Lee - URLSession async/await](https://www.avanderlee.com/concurrency/urlsession-async-await-network-requests-in-swift/) - Modern networking
- [Next.js Docs - API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) - Next.js API patterns

### Secondary (MEDIUM confidence)
- Existing codebase analysis: `/dashboard/src/lib/api/workflow-queries.ts`, `/dashboard/src/lib/api/digital-queries.ts`
- Existing component patterns: `/dashboard/src/dashboard-kit/components/dashboard/health-score.tsx`

## Metadata

**Confidence breakdown:**
- API architecture: HIGH - Clear patterns in existing codebase
- iOS networking: HIGH - Official Apple patterns, multiple authoritative sources
- Data model: HIGH - Based on existing dashboard types
- Real-time strategy: MEDIUM - Polling is simple but alternatives exist

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable domain, 30 days)
