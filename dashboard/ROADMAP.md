# Dashboard Roadmap

> Business Operations Dashboard for IAML
> Last Updated: 2026-01-13

---

## Status Overview

| Dashboard | Status | Data Source | Route |
|-----------|--------|-------------|-------|
| CEO (Main) | ✅ Complete | Supabase | `/dashboard` |
| Digital | ✅ Complete | External APIs | `/dashboard/digital` |
| Marketing | ✅ Complete | Supabase | `/dashboard/marketing` |
| Programs | ✅ Complete | Supabase | `/dashboard/programs` |
| Lead Intelligence | 📋 Planned | Supabase + APIs | `/dashboard/leads` |

---

## Completed

### CEO Dashboard (`/dashboard`)
- Campaign overview metrics
- Channel performance breakdown (LinkedIn, Smartlead, Phone, GHL)
- Health score based on engagement/registration rates
- Active campaigns list
- Recent activity feed
- Quick links to department dashboards

### Digital Dashboard (`/dashboard/digital`)
- **Uptime Monitoring** - BetterStack API integration
- **Performance Scores** - Google PageSpeed API (mobile/desktop)
- **Deployment History** - Vercel API
- **Repository Activity** - GitHub API (commits, PRs)
- **Error Tracking** - Sentry API (placeholder - needs valid token)
- Health score calculation across all metrics

### Marketing Dashboard (`/dashboard/marketing`)
- Campaign funnel metrics
- Multi-channel campaign tracking
- Contact engagement metrics
- Conversion tracking
- Activity timeline

### Programs Dashboard (`/dashboard/programs`)
- **Program Pipeline** - 90-day upcoming programs
- **Health Score** - 6-component weighted calculation
- **10-Point Readiness Checklist**:
  1. Faculty Confirmed
  2. Faculty Brief Sent
  3. Venue Confirmed
  4. Materials Ordered
  5. Materials Received
  6. SHRM Approved
  7. A/V Ordered
  8. Catering Confirmed
  9. Room Block Active
  10. Registration Page Live
- **At-Risk Programs** - Low enrollment or readiness alerts
- **Room Block Alerts** - Cutoff date warnings
- **Faculty Gaps** - Unconfirmed faculty assignments
- **Activity Feed** - Program operations log

---

## In Progress

### Data Population
- [ ] Populate readiness checklist items for upcoming programs
- [ ] Add more faculty assignments from Airtable
- [ ] Configure room blocks for in-person programs

### Environment Configuration
- [ ] Verify Supabase env vars in Vercel production
- [ ] Fix Sentry API authentication (needs valid token in Vercel)

---

## Planned

### Phase 1: Data Automation
- [ ] **Airtable → Supabase Sync** - n8n workflow to sync enrollment numbers
- [ ] **Readiness Auto-Updates** - Trigger readiness updates from operational events
- [ ] **Activity Logging** - Auto-log registration, cancellation, transfer events

### Phase 2: Admin Features
- [ ] **Readiness Checklist UI** - Toggle checklist items from dashboard
- [ ] **Program Detail View** - Click-through to individual program details
- [ ] **Bulk Operations** - Update multiple programs at once

### Phase 3: Notifications & Alerts
- [ ] **Email Alerts** - Critical program alerts to stakeholders
- [ ] **Slack Integration** - Post alerts to Slack channel
- [ ] **Daily Digest** - Morning summary of at-risk programs

### Phase 4: Lead Intelligence Dashboard
- [ ] **Lead Intelligence Dashboard** (`/dashboard/leads`)
  - Platform health (LinkedIn, Apollo, Apify scrapers)
  - Email sending capacity across domains
  - Domain health & rotation status
  - Data quality metrics (validation rates, enrichment)
  - Contact database stats
  - Lead pipeline visualization
  - Health Score Components:
    - Platform Health (25%)
    - Capacity Available (25%)
    - Data Quality (20%)
    - Domain Health (20%)
    - No Critical Blockers (10%)

### Phase 5: Additional Dashboards
- [ ] **Finance Dashboard** - Revenue tracking, payment status
- [ ] **Faculty Dashboard** - Teaching assignments, availability
- [ ] **Venue Dashboard** - Venue relationships, contracts

### Phase 6: Reporting
- [ ] **PDF Export** - Export dashboard views as PDF
- [ ] **Scheduled Reports** - Weekly/monthly automated reports
- [ ] **Board Dashboard** - Executive summary view

---

## Data Architecture

### Supabase Tables

**Campaign Tracking** (Marketing/CEO):
- `multichannel_campaigns`
- `campaign_channels`
- `campaign_contacts`
- `campaign_activity`
- `contacts`

**Programs** (Programs Dashboard):
- `program_instances` - Core program data (synced from Airtable)
- `program_readiness` - 10-point checklist
- `room_blocks` - Hotel room block tracking
- `faculty_assignments` - Faculty per program
- `program_activity` - Operations log

**Views**:
- `program_dashboard_summary` - Main dashboard query
- `readiness_breakdown` - Aggregate checklist stats
- `at_risk_programs` - Programs needing attention
- `room_block_alerts` - Approaching cutoff dates
- `faculty_gaps` - Unconfirmed faculty

### Lead Intelligence (Planned)
- `domains` - Email sending domains, health scores, limits
- `domain_health_log` - Daily domain health snapshots
- `lead_sources` - Platform configurations (Apollo, LinkedIn, Apify)
- `lead_imports` - Import batches with validation stats
- `sending_capacity` - Daily capacity calculations

### External APIs

**Digital Dashboard:**
| Service | Purpose | Auth Method |
|---------|---------|-------------|
| BetterStack | Uptime monitoring | API Key |
| Google PageSpeed | Performance scores | API Key |
| Vercel | Deployments | Bearer Token |
| GitHub | Repository activity | Bearer Token |
| Sentry | Error tracking | Bearer Token |

**Lead Intelligence (Planned):**
| Service | Purpose | Auth Method |
|---------|---------|-------------|
| Apollo | Lead sourcing, credits | API Key |
| PhantomBuster | LinkedIn automation | API Key |
| NeverBounce | Email validation | API Key |
| Smartlead | Email platform stats | API Key |

---

## Technical Debt

### Known Issues
- [ ] Sentry API returning 403 - needs valid token configured in Vercel
- [ ] Shell env var `SENTRY_AUTH_TOKEN` conflicts with `.env.local` - fixed locally with `unset` in .zshrc

### Improvements
- [ ] Add loading skeletons for all dashboard sections
- [ ] Implement error boundaries for API failures
- [ ] Add retry logic for flaky external APIs
- [ ] Cache external API responses longer (PageSpeed especially)

### Testing
- [ ] Add integration tests for Supabase queries
- [ ] Add visual regression tests for dashboard layouts
- [ ] Test responsive design at all breakpoints

---

## Environment Variables

### Required in Vercel

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Digital Dashboard APIs
BETTERSTACK_API_KEY=
PAGESPEED_API_KEY=
VERCEL_API_TOKEN=
GITHUB_TOKEN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

---

## File Structure

```
dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # CEO dashboard (main)
│   │   │   ├── dashboard-content.tsx
│   │   │   ├── digital/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── digital-content.tsx
│   │   │   │   └── digital-skeleton.tsx
│   │   │   ├── marketing/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── marketing-content.tsx
│   │   │   │   └── marketing-skeleton.tsx
│   │   │   └── programs/
│   │   │       ├── page.tsx
│   │   │       ├── programs-content.tsx
│   │   │       └── programs-skeleton.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api/
│   │   │   ├── digital-queries.ts    # External API calls
│   │   │   └── programs-queries.ts   # Supabase queries
│   │   └── supabase/
│   │       ├── server.ts
│   │       ├── client.ts
│   │       ├── queries.ts            # Campaign queries
│   │       └── types.ts
│   └── dashboard-kit/                # Shared UI components
│       └── components/
│           └── dashboard/
│               ├── metric-card.tsx
│               ├── health-score.tsx
│               ├── activity-feed.tsx
│               └── alert-list.tsx
├── ROADMAP.md                        # This file
└── ...
```

---

## Quick Commands

```bash
# Development
cd dashboard && npm run dev

# Build
cd dashboard && npm run build

# Preview Deploy
cd dashboard && npx vercel

# Production Deploy
cd dashboard && npx vercel --prod
```

---

## Related Documentation

- Business OS Architecture: `business-os/docs/architecture/`
- Campaign Tracking Schema: `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md`
- Programs Department Spec: `business-os/departments/programs/DEPARTMENT.md`
- Lead Intelligence Spec: `business-os/departments/lead-intelligence/DEPARTMENT.md`
- Marketing Department Spec: `business-os/departments/marketing/DEPARTMENT.md`
- Digital Department Spec: `business-os/departments/digital/DEPARTMENT.md`
- Supabase Migrations: `supabase/migrations/`
