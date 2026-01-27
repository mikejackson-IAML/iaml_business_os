# Web Intelligence Department

## What This Is

A comprehensive web analytics and SEO intelligence system for IAML that automatically collects, analyzes, and reports on website performance, search rankings, competitor activity, and content health — providing actionable insights without manual data gathering.

## Core Value

Know exactly how your web presence is performing and get alerted before problems become visible to customers.

## Current Milestone: v1.0 Web Intelligence Foundation

**Goal:** Build automated data collection, analysis, and alerting for all web intelligence metrics — traffic, rankings, technical SEO, competitors, and content performance.

**Target capabilities:**
- Daily traffic data collection from GA4
- Keyword ranking tracking via DataForSEO
- Technical SEO monitoring via Google Search Console
- Competitor ranking and backlink tracking
- Content decay detection and alerts
- AI-powered insight generation
- Automated weekly/monthly reports
- Slack alerts for anomalies and opportunities

**Key integrations:**
- GA4 (via MCP or API)
- DataForSEO (via MCP)
- Google Search Console API
- Claude API (insight generation)
- Slack (alerts and reports)
- Supabase (data storage)
- n8n (workflow orchestration)

---

## Requirements

### Active

*Current scope (Web Intelligence v1.0):*

- [ ] Database schema for all web intelligence data
- [ ] GA4 traffic collection workflows
- [ ] DataForSEO ranking collection workflows
- [ ] Google Search Console integration
- [ ] Competitor tracking workflows
- [ ] Content performance analysis
- [ ] AI insight generation
- [ ] Automated reporting system
- [ ] Alert and notification system

### Out of Scope

- Real-time dashboards (use existing Business OS dashboard)
- Paid advertising tracking (separate initiative)
- Social media analytics (handled by Marketing Department)
- Email campaign analytics (handled by Marketing Department)

---

## Vision

1. **Automated data collection** - No manual exports or copy-pasting from GA4/GSC/DataForSEO
2. **Proactive alerting** - Know about ranking drops, traffic anomalies, and technical issues before they compound
3. **Competitive intelligence** - Understand what competitors are doing and where opportunities exist
4. **Content optimization** - Identify decaying content and optimization opportunities automatically
5. **Executive reporting** - Weekly/monthly reports generated and delivered without manual effort

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WEB INTELLIGENCE DEPARTMENT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Data Sources                     Processing                    Output   │
│  ┌─────────────┐                 ┌─────────────┐            ┌─────────┐ │
│  │    GA4      │────┐            │             │            │  Slack  │ │
│  │   (MCP)     │    │            │    n8n      │───────────▶│ Alerts  │ │
│  └─────────────┘    │            │  Workflows  │            └─────────┘ │
│  ┌─────────────┐    │            │             │            ┌─────────┐ │
│  │ DataForSEO  │────┼───────────▶│  (46 total) │───────────▶│ Reports │ │
│  │   (MCP)     │    │            │             │            └─────────┘ │
│  └─────────────┘    │            │             │            ┌─────────┐ │
│  ┌─────────────┐    │            │             │            │Dashboard│ │
│  │    GSC      │────┤            └──────┬──────┘            │  (API)  │ │
│  │   (API)     │    │                   │                   └─────────┘ │
│  └─────────────┘    │                   │                               │
│  ┌─────────────┐    │            ┌──────┴──────┐                        │
│  │ Competitors │────┘            │  Supabase   │                        │
│  │  (scraping) │                 │  (storage)  │                        │
│  └─────────────┘                 └─────────────┘                        │
│                                                                          │
│  AI Layer:                                                               │
│  └── Claude API for insight generation and anomaly explanation          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Success Metrics

- All 46 workflows deployed and operational
- Daily data collection running without manual intervention
- Alerts firing within 1 hour of anomaly detection
- Weekly reports delivered automatically every Monday
- Zero missed ranking drops or traffic anomalies

## Constraints

- **n8n for all orchestration** - No custom backend services
- **Supabase for storage** - All data lives in PostgreSQL
- **n8n-brain integration** - Use existing learning layer for workflow patterns
- **Existing dashboard** - Reports feed into Business OS dashboard, no separate UI
- **API rate limits** - Respect DataForSEO and GSC quotas

## Team

- Solo operator with Claude Code assistance
- n8n-brain provides accumulated knowledge across sessions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DataForSEO over SEMrush API | Better pricing, MCP available | — Pending |
| Daily collection cadence | Balance freshness vs API costs | — Pending |
| Supabase for time-series | Postgres handles this fine at our scale | — Pending |
| Claude for insights | Already integrated in Business OS | — Pending |

---
*Last updated: 2026-01-20 - Project initialization*
