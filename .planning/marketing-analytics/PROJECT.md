# Marketing Analytics Dashboard

## What This Is

A marketing analytics dashboard for IAML that visualizes whether the sales playbook is working. Built into the existing Next.js CEO dashboard, it shows pipeline status, channel performance, campaign health, and conversion metrics across the entire multi-channel outreach operation (SmartLead, HeyReach, GHL, phone). Designed for a solo operator who needs to see what's working, what's not, and the status of all campaigns at a glance.

## Core Value

Open the dashboard and immediately know which campaigns and channels are producing registrations, at what cost, and whether conversion goals are being hit.

## Requirements

### Validated

- ✓ Next.js 16 dashboard foundation with Tailwind, Radix UI, Tremor — existing
- ✓ Supabase database infrastructure — existing
- ✓ n8n workflow automation platform — existing
- ✓ Marketing dashboard page with health score, email metrics, LinkedIn stats — existing
- ✓ Lead Intelligence dashboard with contact management — existing
- ✓ Authentication and user management — existing

### Active

- [ ] Supabase schema for campaign analytics (campaigns, contacts, stages, activities, conversions)
- [ ] n8n data ingestion workflows (SmartLead, HeyReach, GHL sync on 15-30 min cadence)
- [ ] Pipeline funnel view (Cold → Registered → Alumni) with aggregate counts
- [ ] Channel scoreboard (SmartLead vs HeyReach vs GHL vs Phone with registrations + cost)
- [ ] Campaign cards with status overview (contacts enrolled, response rate, conversions)
- [ ] Campaign drill-down with per-step metrics (email 1 open rate, email 2 reply rate, etc.)
- [ ] Global tier filter (All / Directors / Executives / Managers) that filters entire dashboard
- [ ] Conversion tracking: Quarterly Update signups → paid program registration
- [ ] Conversion tracking: Director engagement → team member registrations
- [ ] Conversion tracking: Referral loop (colleague referrals generated and converted)
- [ ] Conversion tracking: Corporate training conversations initiated
- [ ] Positive reply rate metric (from Gemini AI classification)
- [ ] Near real-time data refresh (15-30 min via n8n webhooks)

### Out of Scope

- Individual contact tracking/CRM features — already covered by Lead Intelligence dashboard
- Warm/qualified intermediate pipeline stages — IAML pipeline is Cold → Registered → Alumni
- Email sequence builder/editor — managed in SmartLead and GHL directly
- LinkedIn sequence builder — managed in HeyReach directly
- Historical trend charts for v1 — add after data accumulates
- A/B test analysis — separate concern, not part of playbook analytics
- iOS app integration — separate GSD project
- Automated alerting/notifications — future enhancement

## Context

### Sales Playbook Strategy
IAML's outreach operates in three tiers with different messaging and goals:
- **Tier 1: Directors** (primary) — get them to attend personally, then refer/send team
- **Tier 2: Executives** — build relationship so they send their teams
- **Tier 3: Managers** (volume) — get them to attend, advocate internally

### Multi-Channel Flow
```
SmartLead (cold email, marketing domains)
  + HeyReach (LinkedIn automation)
    → On any reply → Gemini AI classifies
      → GHL (personal outreach from iaml.com)
        → Phone follow-up (Tier 1 & 2 only, after engagement signals)
```

### Data Sources (all need ingestion workflows)
- **SmartLead**: Email sends, opens, clicks, bounces, replies (30+ mailboxes across marketing domains)
- **HeyReach**: LinkedIn connection requests, acceptances, DMs, responses
- **GoHighLevel**: CRM activity, branch assignments (A/A+/B/C), phone calls, registrations
- **Gemini AI**: Reply classification results (positive, not now, not interested)
- **Supabase**: Will be central analytics store (new schema needed)
- **n8n**: Orchestrates all data sync

### Existing Dashboard Infrastructure
- Next.js 16 + React 19 + Tailwind CSS
- Tremor for charts, Radix UI for components
- Supabase SSR client for data fetching
- Existing marketing page at `dashboard/src/app/dashboard/marketing/`
- Dashboard-kit component library (MetricCard, HealthScore, ActivityFeed, AlertList)
- 12-column grid layout pattern with health score + metrics cards

### Email Infrastructure
- 60 total mailboxes across multiple domain types
- Daily capacity ~1,500 emails
- Domain strategy: marketing domains for cold, iaml.com for personal follow-up

### Key Conversion Goals (from playbook)
1. Quarterly Update signups from cold outreach (lead indicator)
2. Quarterly Update → paid program conversion (key funnel metric)
3. Team member registrations from engaged executives
4. Colleague referrals generated
5. Cost per registration by channel
6. Corporate training conversations initiated

## Constraints

- **Tech stack**: Must use existing Next.js 16 + Tailwind + Radix UI + Tremor stack — consistency with rest of dashboard
- **Data layer**: Supabase as central analytics store — all platform data syncs here via n8n
- **No direct API calls from dashboard**: Dashboard reads from Supabase only. n8n handles platform API integrations
- **Solo operator**: Dashboard must be immediately understandable without training
- **Existing patterns**: Follow existing dashboard component patterns (MetricCard, HealthScore, 12-col grid)
- **Platform APIs**: SmartLead, HeyReach, and GHL APIs are the source of truth. Schema must accommodate their data models

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Simplified pipeline (Cold → Registered → Alumni) | IAML doesn't track intermediate warm/qualified stages | — Pending |
| Global tier filter instead of per-section breakdown | Simpler UX, one toggle filters everything | — Pending |
| Supabase as analytics store (not direct API queries) | Consistent with architecture, enables fast dashboard loads, n8n handles sync | — Pending |
| Near real-time (15-30 min sync) | Balance between freshness and API rate limits | — Pending |
| AI classification as single metric (positive reply rate) | Full breakdown not needed, just the signal | — Pending |
| Separate GSD project from iOS app | Independent scope, different timeline, no dependency overlap | — Pending |

---
*Last updated: 2026-02-11 after initialization*
