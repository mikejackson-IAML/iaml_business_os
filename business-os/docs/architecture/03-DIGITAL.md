# Digital Department

## Director Role

**Digital Director** oversees all website operations, performance monitoring, quality assurance, security, and development activities. The Director maintains awareness of site health, can answer "Is everything working?" at any time, and ensures the registration process—the core business function—is always operational.

## Domain Scope

**Owns:**
- Website uptime and performance
- Database health and operations (Supabase)
- Security monitoring and compliance
- User analytics and conversion tracking
- Quality assurance and automated testing
- Development and deployment pipeline
- Registration flow integrity

**Does Not Own:**
- Marketing campaigns and content (→ Marketing)
- Lead data management (→ Lead Intelligence)
- Content asset creation (→ Content)
- Sales processes (→ Sales)

## Sub-Departments

### 1. Site Performance

**Focus:** Speed, uptime, and user experience

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Uptime Monitor | Monitor | Site availability, response times | Every 5 minutes |
| Speed Tracker | Monitor | Page load times, Core Web Vitals | Daily |
| Cache Manager | Monitor | Cache hit rates, CDN performance | Daily |
| Mobile Performance Monitor | Monitor | Mobile-specific speed metrics | Daily |

**Integrations:**
- Vercel (hosting/analytics)
- UptimeRobot or BetterStack (uptime monitoring)
- Google PageSpeed Insights API

**Key Metrics:**
- Uptime percentage (target: 99.9%)
- Average page load time (target: <2s)
- Core Web Vitals:
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- Cache hit rate

**Thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| Uptime (24h) | <99.5% | <99% |
| Page Load | >2.5s | >4s |
| LCP | >2.5s | >4s |

---

### 2. Database (Supabase)

**Focus:** Data layer health and performance

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Query Monitor | Monitor | Slow queries, failed transactions | Continuous |
| Backup Verifier | Monitor | Backup success, restore test readiness | Daily |
| Usage Tracker | Monitor | Storage, bandwidth, approaching limits | Daily |
| Connection Monitor | Monitor | Connection pool health, saturation | Continuous |

**Integrations:**
- Supabase dashboard API
- Supabase management API

**Key Metrics:**
- Query response time (p95)
- Backup status (last successful, age)
- Storage usage vs. plan limit (%)
- Bandwidth usage vs. plan limit (%)
- Active connections vs. pool size

**Thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| Query P95 | >200ms | >500ms |
| Usage % | >70% | >85% |
| Connection Pool | >70% | >90% |
| Backup Age | >24h | >48h |

---

### 3. Security

**Focus:** Protection, compliance, and threat detection

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Vulnerability Scanner | Agent | Check dependencies for known CVEs | Daily |
| Certificate Monitor | Monitor | SSL expiration, DNS health | Daily |
| Auth Monitor | Monitor | Failed login patterns, suspicious activity | Continuous |
| Error Spike Detector | Monitor | Unusual 500 error patterns | Continuous |

**Integrations:**
- GitHub (Dependabot, security scanning)
- SSL Labs API (or similar)
- Sentry (error tracking)
- Supabase Auth logs

**Key Metrics:**
- Days until SSL certificate expiration
- Vulnerabilities by severity (critical/high/medium/low)
- Failed login attempts (pattern detection)
- Error rate (5xx errors / total requests)

**Thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| SSL Expiry | <30 days | <7 days |
| Critical Vulns | Any | Any (immediate) |
| High Vulns | >2 | >5 |
| Error Rate | >1% | >5% |
| Failed Logins | Pattern detected | Sustained attack |

---

### 4. Analytics

**Focus:** User behavior and conversion optimization

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Traffic Analyst | Monitor | Traffic trends, sources, anomalies | Daily |
| Conversion Tracker | Monitor | Registration funnel performance | Daily |
| Behavior Analyst | Agent | User flow analysis, drop-off identification | Weekly |
| Platform Comparator | Monitor | Mobile vs. desktop metrics | Weekly |

**Integrations:**
- Google Analytics 4 (or Plausible/PostHog)
- Hotjar (if using for heatmaps)

**Key Metrics:**
- Total traffic (daily/weekly/monthly with trend)
- Conversion rate (visitor → registration)
- Bounce rate by key pages
- Mobile vs. desktop traffic split
- Mobile vs. desktop conversion rate
- Top traffic sources

**Funnel Stages:**
```
Homepage → Seminar Page → Registration Start → Payment → Confirmation
   ↓           ↓              ↓                ↓           ↓
  [%]        [%]            [%]              [%]        [%]
```

---

### 5. Quality Assurance

**Focus:** Automated testing and validation of critical user journeys

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Registration Tester | Agent | Playwright tests for all 20 registration paths | Daily (6 AM) |
| Payment Verifier | Agent | Stripe checkout and invoice flow tests | Daily |
| Integration Monitor | Monitor | GHL receiving data, emails queuing | Daily |
| Link Checker | Agent | Crawl for broken links | Weekly |
| Form Validator | Agent | Test all form submissions | Daily |
| Post-Deploy Smoker | Agent | Quick test suite after deployments | On deploy |

**Registration Test Matrix (IAML-Specific):**

| Program Type | In-Person | Virtual | Paths |
|--------------|-----------|---------|-------|
| 6 dual-format programs | ✓ | ✓ | 12 |
| 8 single-format programs | ✓ | — | 8 |
| **Total** | 14 | 6 | **20** |

**Payment Methods to Test:**
- Stripe checkout flow
- Stripe invoice system

**Integration Verification (per registration):**
1. Form submission successful
2. Stripe payment processed (test mode or micro-auth)
3. GHL contact created (verify via API)
4. Confirmation email queued (verify via API)

**Integrations:**
- Playwright MCP (browser automation)
- Stripe API (payment verification)
- GHL API (contact and email verification)

**Key Metrics:**
- Test pass rate (target: 100%)
- Last successful full test run
- All registration paths status (pass/fail grid)
- Broken links count
- Time since last deployment smoke test

---

### 6. Development

**Focus:** Code quality, deployment pipeline, and technical roadmap

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Deployment Monitor | Monitor | Build success/failure, deploy status | On deploy |
| Dependency Tracker | Agent | Available updates, security patches | Weekly |
| Bug Tracker | Skill | Triage and prioritize issues | On-demand |
| Roadmap Manager | Skill | Feature backlog, sprint planning | On-demand |
| Tech Debt Logger | Skill | Track and prioritize technical debt | On-demand |

**Integrations:**
- GitHub (code, PRs, issues)
- Vercel (deployments)
- Linear (if using for project management)

**Key Metrics:**
- Last deployment (timestamp, status)
- Build success rate (30-day)
- Open bugs by priority (critical/high/medium/low)
- Dependencies with available updates
- Dependencies with security patches needed

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine monitoring and alerting
- Cache invalidation
- Running scheduled tests (Playwright, etc.)
- Dependency update checks (reporting only)
- Log analysis and anomaly detection
- Performance data collection

### Recommend + Approve
- Dependency updates (especially major versions)
- Infrastructure changes (scaling, new services)
- New monitoring implementations
- Feature prioritization decisions
- Database schema changes
- Third-party service changes

### Escalate Immediately
- **Site down** — Any outage affecting users
- **Registration flow broken** — Any path failing
- **Payment processing failure** — Stripe issues
- **Security vulnerability (critical)** — Immediate patch needed
- **Data breach indicators** — Suspicious access patterns
- **Database failure** — Connection issues, backup failures
- **SSL certificate expired/expiring** — <7 days

---

## Dashboard View (CEO)

```
┌─────────────────────────────────────────────────────────────────┐
│ DIGITAL                                      Health: 94/100 🟢  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ SITE STATUS                                                      │
│ ───────────────────────────────────────────────────────────────  │
│ Status: ✅ Online    Uptime (30d): 99.94%    Avg Load: 1.8s    │
│                                                                  │
│ REGISTRATION FLOWS                                               │
│ ───────────────────────────────────────────────────────────────  │
│ Last Full Test: Today 6:00 AM                                   │
│ All 20 Paths: ✅ Passing                                         │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ In-Person (14): ✅✅✅✅✅✅✅✅✅✅✅✅✅✅              │ │
│ │ Virtual (6):    ✅✅✅✅✅✅                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Stripe: ✅ Operational    GHL: ✅ Receiving    Emails: ✅ Queuing│
│                                                                  │
│ DATABASE                                                         │
│ ───────────────────────────────────────────────────────────────  │
│ Query P95: 45ms     Connections: 12/100     Usage: 78%         │
│ Last Backup: Today 3:00 AM ✅                                    │
│                                                                  │
│ SECURITY                                                         │
│ ───────────────────────────────────────────────────────────────  │
│ SSL: 45 days remaining    Vulnerabilities: 0 critical, 2 medium │
│ Auth: No suspicious patterns                                    │
│                                                                  │
│ NEEDS ATTENTION                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ ⚠️ Supabase approaching 80% of plan limit                       │
│ ⚠️ 2 dependency security patches available                      │
│ 🔴 Mobile conversion down 12% this week                         │
│                                                                  │
│ DEVELOPMENT                                                      │
│ ───────────────────────────────────────────────────────────────  │
│ Last Deploy: 2 days ago ✅    Open Bugs: 3 (1 high, 2 medium)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Health Score Components

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Uptime | 0.25 | 30-day uptime percentage |
| Registration Tests | 0.25 | % of paths passing (critical function) |
| Performance | 0.15 | Page load time vs. target |
| Database Health | 0.15 | Composite of query time, backup, usage |
| Security | 0.10 | Inverse of vulnerability severity score |
| No Critical Blockers | 0.10 | Binary: 100 if no critical alerts, 0 if any |

---

## Learning Objectives

What Digital Director should get better at over time:

1. **Performance Baselines** — Understand normal patterns to better detect anomalies
2. **Deployment Impact** — Correlate deployments with performance/error changes
3. **Traffic Patterns** — Predict high-traffic periods for proactive scaling
4. **Failure Patterns** — Identify common failure modes and preventive measures
5. **Conversion Factors** — Understand what site changes impact registration conversion
6. **Mobile vs. Desktop** — Track platform-specific issues and optimizations

---

## Cross-Department Coordination

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Conversion drop detected | Marketing | Alert to investigate campaign issues |
| Traffic spike expected | Lead Intelligence | Prepare for campaign launch load |
| New feature needed | Content | Request copy/assets |
| Registration data issues | Lead Intelligence | Verify data flow to contact database |
| SEO-impacting changes | Marketing | Notify before Core Web Vitals changes |

---

## Playwright Test Specification

### Daily Test Suite (6:00 AM)

```javascript
// Pseudo-code structure for registration tests

const programs = [
  // Dual-format programs (12 paths)
  { name: "Program 1", formats: ["in-person", "virtual"] },
  { name: "Program 2", formats: ["in-person", "virtual"] },
  // ... 4 more dual-format

  // Single-format programs (8 paths)
  { name: "Program 7", formats: ["in-person"] },
  // ... 7 more single-format
];

for (const program of programs) {
  for (const format of program.formats) {
    test(`${program.name} - ${format}`, async () => {
      // 1. Navigate to program page
      // 2. Select format
      // 3. Fill registration form with test data
      // 4. Complete Stripe payment (test mode)
      // 5. Verify confirmation page
      // 6. Check GHL API for contact creation
      // 7. Check GHL API for email queued
    });
  }
}
```

### Post-Deploy Smoke Test

Runs automatically after any Vercel deployment:

1. Homepage loads (<3s)
2. Navigation works
3. At least one registration path accessible
4. No console errors on key pages
5. API endpoints responding
