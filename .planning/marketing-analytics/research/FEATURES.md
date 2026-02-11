# Feature Landscape: Marketing Analytics Dashboard

**Domain:** Multi-channel B2B outreach analytics for event registration & corporate training sales
**Researched:** 2026-02-11
**Overall confidence:** HIGH (well-defined domain, existing schema studied, PROJECT.md requirements validated against industry patterns)

---

## Table Stakes

Features the dashboard must have on day one, or it fails the "open and immediately know what's working" test. Every feature below directly answers one of the playbook's core questions.

### TS-1: Pipeline Funnel View (Cold / Registered / Alumni)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | The single most basic question: "How many people moved through?" IAML's pipeline is intentionally simple (3 stages). Without this, the dashboard has no reason to exist. |
| **Complexity** | Low |
| **Data dependency** | `campaign_contacts.quarterly_update_registered`, `campaign_contacts.status`, `contacts.lifecycle_stage`. The `campaign_funnel` view already computes `total_contacts`, `engaged_contacts`, `registered_contacts`. |
| **What it shows** | Horizontal or vertical funnel: Total Contacts in outreach -> Registered for Quarterly Updates -> Alumni (paid program). Aggregate counts + conversion percentages between each stage. |
| **Confidence** | HIGH -- schema supports it, view exists |

### TS-2: Channel Scoreboard

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Answers "which channel is producing registrations?" without which you cannot allocate budget or effort. Every multi-channel outreach tool (Outreach, Apollo, lemlist) has this. |
| **Complexity** | Medium |
| **Data dependency** | `channel_performance` view (replies, hot leads per channel). Needs extension: registrations attributed to channel via `campaign_contacts.branch_trigger_channel` + `quarterly_update_registered`. Cost data needs new column or config table (monthly spend per channel). |
| **What it shows** | Table/card grid: SmartLead vs HeyReach vs GHL vs Phone. Per channel: contacts reached, replies, positive replies, registrations, cost, cost-per-registration. |
| **Confidence** | HIGH -- standard pattern, schema mostly supports it |

### TS-3: Campaign Cards with Status Overview

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Solo operator needs to see all campaigns at a glance: what's running, what's stalled, what finished. The existing marketing page already has campaign cards but only shows name/status/offer -- needs metrics added. |
| **Complexity** | Low |
| **Data dependency** | `multichannel_campaigns` (status, dates), `campaign_funnel` view (per-campaign counts), `campaign_activity` (for recent activity indicator). All exist. |
| **What it shows** | Card per campaign: name, status badge (active/paused/completed), contacts enrolled, reply rate, positive reply rate, registrations, days running. Color-coded health indicator. |
| **Confidence** | HIGH -- extends existing pattern |

### TS-4: Email Performance Metrics (Aggregate)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Email is the primary outreach channel (60 mailboxes, ~1,500/day). Open rate, reply rate, bounce rate are the baseline health signals. Already partially implemented in existing marketing dashboard but needs refinement. |
| **Complexity** | Low |
| **Data dependency** | `campaign_activity` counts by type (sent, opened, clicked, replied, bounced). `getMarketingMetrics()` already computes these. |
| **What it shows** | MetricCards (existing component): Open Rate, Reply Rate, Bounce Rate, Click Rate. With status coloring (green/yellow/red) against benchmarks. Benchmarks: open rate target 34%, reply rate target 5%, bounce rate threshold 3%. |
| **Confidence** | HIGH -- already partially built, schema supports it |

### TS-5: LinkedIn Performance Metrics (Aggregate)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | LinkedIn is the second channel. HeyReach provides its own dashboard, but the whole point of building a unified dashboard is seeing LinkedIn alongside email without switching tools. Already partially implemented. |
| **Complexity** | Low |
| **Data dependency** | `campaign_activity` counts for LinkedIn events (connection_sent, connection_accepted, message_sent, message_replied). `getLinkedInAutomationStatus()` already computes these. |
| **What it shows** | Connections Sent, Acceptance Rate, Messages Sent, Response Rate. Same MetricCard pattern. Benchmarks: acceptance rate target 30%, response rate target 15%. |
| **Confidence** | HIGH -- already partially built |

### TS-6: Positive Reply Rate (AI-Classified)

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Raw reply rate includes "not interested" and "unsubscribe" responses. Positive reply rate correlates 33% better with booked meetings than raw reply rate (per Outreach.io research). Gemini AI is already classifying replies. This is the signal that matters. |
| **Complexity** | Medium |
| **Data dependency** | `campaign_activity.metadata` should contain Gemini classification results (`reply_sentiment` field on `campaign_contact_channels`). Needs: consistent classification tagging in activity metadata (positive / not_now / not_interested / unsubscribe / other). |
| **What it shows** | Single prominent metric: Positive Reply Rate (% of total replies classified as positive). Optionally: breakdown pie chart (positive / not now / not interested). |
| **Confidence** | MEDIUM -- depends on how consistently Gemini classifications are stored; schema has `reply_sentiment` field but ingestion workflow determines quality |

### TS-7: Global Tier Filter

| Attribute | Detail |
|-----------|--------|
| **Why expected** | IAML's playbook treats Directors, Executives, and Managers differently. Viewing metrics per tier answers "is the Director strategy working?" vs "is the volume play producing?" Without filtering, aggregate numbers mask tier-specific problems. |
| **Complexity** | Medium |
| **Data dependency** | Needs: tier assignment on contacts or campaign_contacts. Currently no `tier` column exists in schema. Options: (a) add `tier` to `contacts` table, (b) derive from `job_title` via classification, (c) add `tier` to `campaign_contacts` since tier assignment is campaign-specific. Recommend (c) -- tier is a campaign enrollment decision. |
| **What it shows** | Toggle/tab bar at top of dashboard: All / Tier 1 (Directors) / Tier 2 (Executives) / Tier 3 (Managers). Filters ALL metrics, funnel, scoreboard, and campaign cards below it. |
| **Confidence** | HIGH for the UX pattern; MEDIUM for data -- requires schema addition |

### TS-8: Registration Conversion Tracking

| Attribute | Detail |
|-----------|--------|
| **Why expected** | The playbook's primary KPI: Quarterly Update signups from cold outreach. "How many of our cold contacts actually registered?" is the bottom-line question. |
| **Complexity** | Low |
| **Data dependency** | `campaign_contacts.quarterly_update_registered` + `quarterly_update_registered_at`. Already in schema. Also `campaign_activity` type `quarterly_registered`. |
| **What it shows** | Registrations count, registration rate (registrations / total contacts in outreach), trend indicator if historical data accumulates. Prominently placed -- this is the north star metric. |
| **Confidence** | HIGH -- schema fully supports it |

### TS-9: Cost Per Registration by Channel

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Directly requested in playbook conversion goals. Without cost context, knowing that "SmartLead produced 50 registrations" is incomplete. Need to know if that cost $5/registration or $500/registration. |
| **Complexity** | Medium |
| **Data dependency** | Needs: cost data per channel. Not in current schema. Options: (a) manual entry table with monthly spend per channel, (b) API-derived from SmartLead/HeyReach billing. Recommend (a) -- simpler, more reliable, costs change infrequently. New table: `channel_costs` (channel, month, amount). Registration attribution from channel scoreboard logic. |
| **What it shows** | Per channel: total spend, registrations, cost-per-registration. Comparison view. |
| **Confidence** | HIGH for the concept; MEDIUM for data -- requires new cost input mechanism |

### TS-10: Deliverability Health Monitoring

| Attribute | Detail |
|-----------|--------|
| **Why expected** | With 60 mailboxes across multiple domains, deliverability is existential. If emails aren't landing in inboxes, nothing else matters. Bounce rate, domain health, and sending velocity are survival metrics. Already partially implemented in existing dashboard. |
| **Complexity** | Low |
| **Data dependency** | `campaign_activity` bounce events, `contacts.email_status`. Already tracked. |
| **What it shows** | Bounce rate with red/yellow/green status, delivery rate, invalid email count. Alert when bounce rate exceeds 3%. |
| **Confidence** | HIGH -- already partially built |

---

## Differentiators

Features that go beyond "does the dashboard work" into "this dashboard is actually useful for making decisions." Not required for v1 launch, but each one meaningfully improves the operator experience.

### D-1: Campaign Drill-Down with Per-Step Metrics

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Standard in SmartLead's own dashboard. Value in unified dashboard: see per-step metrics for email AND LinkedIn in one view. Shows where in the sequence people drop off. |
| **Complexity** | High |
| **Data dependency** | `campaign_messages` (sequence_order, message_code), `campaign_activity` (tied to message_id). Schema supports it but queries are complex: need to aggregate activity counts per message step per campaign. |
| **What it shows** | Click into a campaign card -> see sequence steps in order. Per step: sends, opens, open rate, clicks, replies, reply rate. Waterfall/drop-off visualization. Email steps and LinkedIn steps shown together in chronological sequence order. |
| **Priority** | HIGH differentiator -- this is where optimization decisions happen |

### D-2: Referral Loop Tracking

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Unique to IAML's model. Directors attend -> refer team members -> team members register. This loop is a key growth mechanism and tracking it answers "are Directors actually generating referrals?" |
| **Complexity** | High |
| **Data dependency** | `campaign_contacts` has `colleague_name`, `colleague_email`, `colleague_registered`. Needs: linking referred contacts back to referrers (parent-child relationship). Current schema stores referral data on the referrer's record but doesn't link to the referred contact's record. May need a `referrals` junction table or a `referred_by_contact_id` on contacts. |
| **What it shows** | Referrals generated (count), referral conversion rate (referred -> registered), top referrers, referral chain depth. |
| **Priority** | MEDIUM differentiator -- critical for Tier 1 strategy validation but lower frequency than campaign metrics |

### D-3: Director Engagement -> Team Registration Tracking

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Playbook conversion goal #2. Specifically tracks whether engaged executives are sending their teams. Different from referral tracking -- this tracks the *influence* of engagement on team registrations from the same company. |
| **Complexity** | High |
| **Data dependency** | Needs: company-level aggregation. If Director at Company X engaged, how many people from Company X subsequently registered? Requires `contacts.company` to be reliably populated and a query joining director engagement status with company-level registration counts. |
| **What it shows** | Companies with engaged directors, team registrations per company, company-level conversion funnel. |
| **Priority** | MEDIUM -- high business value but complex data requirements |

### D-4: Phone Channel Metrics

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Phone is Tier 1 & 2 follow-up channel. Schema already tracks call_attempted, call_connected, call_no_answer, voicemail_left, callback events. Surfacing these completes the multi-channel picture. |
| **Complexity** | Medium |
| **Data dependency** | `campaign_activity` phone events, `campaign_contact_channels.call_attempts`, `last_call_outcome`. Already in schema. GHL integration needed to sync call data. |
| **What it shows** | Calls attempted, connection rate, call outcomes breakdown, callbacks scheduled vs completed. |
| **Priority** | MEDIUM differentiator -- completes multi-channel view |

### D-5: GHL Branch Distribution

| Attribute | Detail |
|-----------|--------|
| **Why expected** | The branch system (A/A+/B/C) is IAML's lead qualification model. Seeing distribution answers "how many positive vs lukewarm vs dead leads?" at a glance. |
| **Complexity** | Low |
| **Data dependency** | `campaign_contacts.ghl_branch`. Already in schema with `campaign_funnel` view computing branch counts. |
| **What it shows** | Horizontal stacked bar or donut chart: Branch A (positive), A+ (interested in secondary), B (not now), C (no contact). Counts and percentages. |
| **Priority** | HIGH differentiator -- low complexity, high signal |

### D-6: Corporate Training Conversations Initiated

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Playbook conversion goal #4. The secondary offer (virtual training programs) is a revenue driver. Tracking how many conversations are initiated helps measure upsell effectiveness. |
| **Complexity** | Medium |
| **Data dependency** | `campaign_contacts.secondary_offer_interested`, `secondary_offer_accepted`, `secondary_offer_program`. Schema supports it. `campaign_activity` type `secondary_interested` and `secondary_accepted` exist. |
| **What it shows** | Secondary offer interest count, acceptance count, conversion rate (interested -> accepted), breakdown by program. |
| **Priority** | MEDIUM differentiator -- revenue tracking for upsell motion |

### D-7: Stale Campaign / Automation Health Alerts

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Solo operator can't monitor everything. Proactive alerts for stalled campaigns, broken automations, or anomalous metrics prevent problems from festering. Partially implemented in existing alert system. |
| **Complexity** | Medium |
| **Data dependency** | Computed from existing data: campaigns not updated in X days, sudden drop in send volume, bounce rate spikes, LinkedIn account issues. `getMarketingAlerts()` already has bounce rate and stalled campaign detection. |
| **What it shows** | Alert panel (already exists as `AlertList` component): critical/warning/info alerts. Extend with: sending volume anomaly, LinkedIn connection request failures, data sync lag detection. |
| **Priority** | MEDIUM differentiator -- operational safety net |

### D-8: Historical Trend Lines

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Without trends, metrics are snapshots. "Reply rate is 6%" means nothing without knowing if it was 3% last month (improving) or 10% last month (declining). PROJECT.md marks this as "add after data accumulates" which is correct. |
| **Complexity** | Medium |
| **Data dependency** | Requires: periodic snapshots of aggregate metrics, OR compute from `campaign_activity.activity_at` timestamps. Tremor charts (already in stack) support time series. Need either a `metric_snapshots` table (n8n captures daily) or on-the-fly aggregation by week/month. |
| **What it shows** | Line charts: reply rate over time, registrations over time, cost per registration over time, channel performance comparison over time. Weekly or monthly granularity. |
| **Priority** | LOW for v1 (need data to accumulate first), HIGH for v2 |

### D-9: Data Freshness Indicator

| Attribute | Detail |
|-----------|--------|
| **Why expected** | Dashboard reads from Supabase, populated by n8n on 15-30 min cadence. If n8n breaks, dashboard shows stale data without the operator knowing. A simple "last synced" indicator prevents false confidence in outdated numbers. |
| **Complexity** | Low |
| **Data dependency** | Needs: `sync_status` table or check `MAX(campaign_activity.created_at)` per source platform. Lightweight. |
| **What it shows** | Badge in header: "SmartLead: synced 12 min ago" / "HeyReach: synced 28 min ago" / "GHL: synced 5 min ago". Yellow/red if stale (>1 hour). |
| **Priority** | HIGH differentiator -- low effort, prevents silent data staleness |

---

## Anti-Features

Features to explicitly NOT build. These are common mistakes in the B2B outreach analytics domain that would waste time, add complexity, or actively mislead.

### AF-1: Real-Time Individual Contact Activity Feed

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | The existing Lead Intelligence dashboard already handles individual contact tracking. Duplicating contact-level activity in the analytics dashboard creates two sources of truth and splits the operator's attention. Analytics should be aggregate; contact management should be separate. |
| **What to do instead** | Link from analytics to Lead Intelligence: "Click campaign -> see contacts" links through to Lead Intelligence filtered view. |

### AF-2: Email Sequence Builder / Editor

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | PROJECT.md explicitly marks this out of scope. Sequences are built in SmartLead and HeyReach where they belong. Building an editor creates a sync nightmare -- which version is the truth? |
| **What to do instead** | Read-only display of sequence steps with metrics. Never allow editing campaign content from the dashboard. |

### AF-3: Complex Multi-Touch Attribution Model

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | B2B multi-touch attribution (linear, time-decay, W-shaped) requires sophisticated data collection and statistical models. IAML's pipeline is simple (Cold -> Registered) and the operation is small enough that first-touch channel attribution is sufficient. Over-engineering attribution will produce false precision with insufficient data volume. |
| **What to do instead** | Use simple first-touch attribution: which channel initiated the contact. Track "which channel triggered the GHL branch assignment" as the engagement channel. If a contact came through SmartLead email AND HeyReach LinkedIn, credit the channel that first produced engagement (reply/connection acceptance). The `branch_trigger_channel` field already captures this. |

### AF-4: A/B Test Statistical Significance Calculator

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | PROJECT.md marks A/B testing as out of scope. While the schema has `message_variants`, building statistical significance testing, confidence intervals, and variant comparison UI is a separate analytical tool. At IAML's volume (~1,500 emails/day), reaching statistical significance on A/B tests takes weeks, and the dashboard should focus on operational health, not experimental design. |
| **What to do instead** | Show variant-level metrics in campaign drill-down (sends, opens, replies per variant) without declaring winners or computing p-values. Let the operator eyeball it. |

### AF-5: Vanity Metric Dashboards (Total Emails Sent, Total Connections)

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | "We sent 50,000 emails this month" feels impressive but says nothing about effectiveness. Total activity volume is a vanity metric. The same trap applies to total connections sent on LinkedIn. These numbers only go up and never tell you to change behavior. |
| **What to do instead** | Always show rates, not just totals. Show totals only as supporting context beneath rates. Lead with: reply rate, positive reply rate, registration rate, cost per registration. Support with: total sent (for context on rate reliability). |

### AF-6: Predictive Analytics / Lead Scoring

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | ML-based lead scoring requires significant historical data, model training, and ongoing maintenance. IAML's pipeline is simple enough that the GHL branch system (A/A+/B/C) IS the lead score. Building a parallel scoring system adds complexity without clear value for a solo operator. |
| **What to do instead** | Surface GHL branch distribution prominently (D-5). The branch assignment logic already encodes lead quality signals. |

### AF-7: Cross-Campaign Contact Deduplication UI

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Deduplication is a data hygiene operation, not an analytics feature. Mixing operational data cleanup into the analytics dashboard muddies its purpose. |
| **What to do instead** | Deduplicate at the data ingestion layer (n8n workflows). Show a "data health" metric (% of contacts with validated emails, % with duplicates) as a health score component, but don't build dedup tools in the dashboard. |

### AF-8: Detailed Domain-Level Deliverability Tracking

| Attribute | Detail |
|-----------|--------|
| **Why avoid** | Tracking bounce rates per sending domain across 60 mailboxes and multiple domain types is a deliverability operations concern, not a campaign analytics concern. SmartLead already provides domain-level deliverability data natively. Replicating it adds massive schema complexity. |
| **What to do instead** | Track aggregate deliverability (bounce rate, delivery rate) in the dashboard. For domain-level investigation, go to SmartLead. Surface an alert if aggregate bounce rate crosses thresholds. |

---

## Feature Dependencies

```
TS-8 (Registration Tracking) <-- foundational, everything references registrations
  |
  +--> TS-1 (Pipeline Funnel) -- needs registration counts
  +--> TS-2 (Channel Scoreboard) -- needs registrations per channel
  +--> TS-9 (Cost Per Registration) -- needs registration counts + cost data
  |
TS-4 (Email Metrics) + TS-5 (LinkedIn Metrics) <-- independent, no deps
  |
  +--> TS-6 (Positive Reply Rate) -- builds on reply tracking
  |
TS-3 (Campaign Cards) <-- needs TS-4 + TS-5 for embedded metrics
  |
  +--> D-1 (Campaign Drill-Down) -- extends campaign cards with detail view
  |
TS-7 (Tier Filter) <-- needs schema addition, then wraps ALL other features
  |
D-5 (Branch Distribution) <-- independent, low-hanging fruit
D-9 (Data Freshness) <-- independent, low-hanging fruit
D-7 (Alerts) <-- extends existing pattern
  |
D-2 (Referral Loop) + D-3 (Director -> Team) <-- complex, dependent on contact/company data quality
  |
D-8 (Historical Trends) <-- needs time, data accumulation
```

### Build Order Implications

**Phase 1 (Foundation):** TS-8, TS-4, TS-5, TS-1, TS-10 -- core metrics and funnel. These have zero new schema dependencies beyond what exists.

**Phase 2 (Channels & Campaigns):** TS-2, TS-3, TS-6, TS-7 -- channel comparison and campaign overview. Requires: tier column addition, cost data input, consistent sentiment tagging.

**Phase 3 (Decision Support):** TS-9, D-1, D-5, D-9, D-7 -- cost analysis, drill-downs, branch visualization, operational health. Requires: cost input table, complex per-step aggregation queries.

**Phase 4 (Growth Tracking):** D-2, D-3, D-4, D-6 -- referral loops, company-level tracking, phone metrics, secondary offer tracking. Requires: referral data model refinement, company-level aggregation, GHL phone data sync.

**Phase 5 (Maturity):** D-8 -- historical trends. Requires: accumulated data over weeks/months.

---

## MVP Recommendation

For MVP (the "open and immediately know what's working" bar), prioritize:

1. **Pipeline Funnel** (TS-1) -- the most fundamental view
2. **Email Metrics** (TS-4) -- already partially built, quick win
3. **LinkedIn Metrics** (TS-5) -- already partially built, quick win
4. **Registration Tracking** (TS-8) -- the north star metric
5. **Campaign Cards with Metrics** (TS-3) -- extends existing pattern
6. **Channel Scoreboard** (TS-2) -- core decision-making view
7. **Data Freshness Indicator** (D-9) -- low effort, prevents silent failures
8. **Branch Distribution** (D-5) -- low effort, high signal

**Defer to post-MVP:**
- **Tier Filter** (TS-7): Needs schema addition and all queries need to accept filter params. Important but can function without it initially by running separate campaigns per tier.
- **Campaign Drill-Down** (D-1): High value but high complexity. Campaign cards with aggregate metrics are sufficient for v1.
- **Historical Trends** (D-8): Needs data accumulation. Cannot deliver meaningful trends on day one.
- **Referral Loop Tracking** (D-2): Complex data model. Track referrals manually initially.
- **Cost Per Registration** (TS-9): Requires cost input mechanism. Can compute manually initially.

---

## Sources

- [SmartLead Dashboard Analytics](https://helpcenter.smartlead.ai/en/articles/100-main-dashboard-analytics-explanation) -- SmartLead's native metrics and drill-down capabilities
- [HeyReach Dashboard Overview](https://help.heyreach.io/en/articles/9877974-dashboard-overview) -- HeyReach's native LinkedIn analytics
- [HeyReach x SmartLead Integration](https://www.heyreach.io/blog/smartlead-integration) -- cross-platform sync patterns and limitations
- [GoHighLevel Call Reporting](https://help.gohighlevel.com/support/solutions/articles/155000002705-call-reporting) -- GHL phone tracking capabilities
- [B2B Marketing Dashboards: Hiding More Than They Reveal](https://www.revsure.ai/blog/b2b-marketing-dashboards-hiding-more-than-they-reveal) -- anti-patterns in B2B dashboards
- [Common Anti-Patterns in Defining Metrics](https://xebia.com/articles/common-anti-patterns-in-defining-metrics-and-how-to-avoid-them/) -- vanity metrics and measurement mistakes
- [Outreach: Optimize for Sentiment Over Response Rate](https://www.outreach.io/resources/blog/optimize-for-sentiment-over-response-rate) -- positive reply rate data (33% higher correlation with meetings)
- [Multi-Touch Attribution for B2B](https://www.hockeystack.com/blog-posts/b2b-multi-touch-attribution) -- why complex attribution is overkill for small operations
- [Cold Email Benchmark Report 2026](https://instantly.ai/cold-email-benchmark-report-2026) -- current email outreach benchmarks
- [10 Outbound Sales KPIs](https://www.plecto.com/blog/sales-performance/10-outbound-sales-kpis-to-track-now-and-why-outbound-still-matters/) -- essential outbound sales metrics
- [Vanity Metrics vs. Actionable Insights](https://agencyanalytics.com/blog/vanity-metrics) -- framework for identifying vanity metrics
- Existing codebase: `dashboard/src/app/dashboard/marketing/marketing-content.tsx` -- current dashboard implementation
- Existing schema: `supabase/migrations/002_campaign_tracking_tables.sql` -- data model review
- Existing queries: `dashboard/src/lib/supabase/queries.ts` -- current query patterns
