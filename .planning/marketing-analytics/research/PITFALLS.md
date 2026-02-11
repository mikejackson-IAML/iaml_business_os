# Domain Pitfalls: Multi-Channel Marketing Analytics Dashboard

**Domain:** Multi-channel marketing analytics with SmartLead, HeyReach, GHL data flowing through n8n into Supabase
**Researched:** 2026-02-11
**Confidence:** MEDIUM-HIGH (verified against existing codebase, API docs, and community patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or fundamentally broken analytics.

---

### Pitfall 1: Cross-Platform Double-Counting Conversions

**What goes wrong:** Each platform (SmartLead, HeyReach, GHL) claims credit for the same conversion independently. A contact who received a SmartLead email, accepted a LinkedIn connection via HeyReach, and then registered through a GHL sequence gets counted as a conversion in all three platforms. Your dashboard shows 3 registrations when there was 1. At scale with ~2,166 contacts across all channels, this inflates conversion numbers by 50-200%.

**Why it happens:** Platform-reported statistics are self-serving. SmartLead counts a conversion if that lead was in their campaign. HeyReach does the same. When you sync stats from each platform's API and sum them, you are summing overlapping claim sets.

**Consequences:**
- Channel ROI calculations are meaningless (every channel looks 2-3x better than reality)
- Budget allocation decisions are made on phantom data
- Registrations count appears far higher than actual sign-ups
- CEO dashboard loses trust immediately when numbers don't match reality

**Prevention:**
- NEVER sum platform-reported conversion counts directly. Use Supabase as the single source of truth for conversion events
- Track conversions at the contact level in `campaign_contacts.quarterly_update_registered`, not by counting platform-level events
- For attribution, implement first-touch or last-touch at the contact level: record which channel's activity was the last before the `quarterly_registered` event in `campaign_activity`
- Deduplicate on `contact_id` -- one contact = one registration maximum, regardless of how many platforms touched them
- Add a `conversion_attributed_channel` column to `campaign_contacts` that gets set exactly once at registration time

**Detection (warning signs):**
- Sum of per-channel conversions exceeds total unique registrations by more than 10%
- Dashboard registration count differs from actual GHL/Airtable registration count
- Channel scoreboard shows more total conversions than the pipeline funnel's "Registered" count

**Phase:** Must be addressed in Phase 1 (data model/schema design). Retrofitting attribution after data is flowing is extremely painful.

**Severity:** CRITICAL

**Sources:**
- [Challenges of Marketing Attribution: Master 2026's Pitfalls](https://www.thesmallbusinessexpo.com/blog/challenges-of-marketing-attribution/)
- [How to Spot & Fix Double-Counted Conversions](https://www.trueroas.com/blog/stop-the-attribution-tug-of-war-how-to-spot-fix-double-counted-conversions-across-meta-google-shopif)
- Direct analysis of existing `campaign_activity` schema which logs per-channel events without cross-channel deduplication logic

---

### Pitfall 2: Contact Identity Fragmentation Across Platforms

**What goes wrong:** The same person exists as different records across SmartLead (identified by email), HeyReach (identified by LinkedIn URL), and GHL (identified by email or phone). When data syncs into Supabase, you end up with one person represented by 2-3 `contacts` rows. Your pipeline funnel shows 2,500 contacts when there are really 2,100 unique people.

**Why it happens:**
- SmartLead uses email as the primary key. HeyReach uses LinkedIn URL. GHL has its own contact ID system
- A contact may have different email addresses in different platforms (personal vs work)
- LinkedIn-only contacts (the 399 "no email" contacts in your current campaign) have no email to match on
- Name matching is unreliable ("Mike Smith" vs "Michael Smith" vs "M. Smith")

**Consequences:**
- Inflated contact counts and deflated conversion rates
- A contact's cross-channel journey is invisible (their SmartLead engagement and HeyReach engagement look like two different people)
- Tier-based filtering breaks because the same Director shows up twice with different metadata
- GHL branch assignment may create conflicting states for the same person

**Prevention:**
- The existing `contacts` table already has both `email` (UNIQUE) and `linkedin_url` -- use these as the two identity anchors
- Build a deterministic matching hierarchy in your n8n sync workflows:
  1. Match on email (exact, case-insensitive)
  2. Match on LinkedIn URL (normalized: strip query params, trailing slashes)
  3. Match on first_name + last_name + company (fuzzy, flag for manual review)
- Create an `external_ids` JSONB column or separate mapping table: `{ smartlead_lead_id: "123", heyreach_contact_id: "456", ghl_contact_id: "789" }`
- Run deduplication as part of every sync workflow, not as a separate cleanup job
- For LinkedIn-only contacts, create the `contacts` record immediately with `linkedin_url` as the anchor, and merge when email is discovered later

**Detection (warning signs):**
- `contacts` table count grows faster than expected relative to campaign enrollment
- Same person appears in activity feed from multiple channels but as different contacts
- Tier filter counts don't match between platforms

**Phase:** Must be addressed in Phase 1 (schema) and Phase 2 (sync workflows). The external ID mapping is a schema decision; the matching logic lives in n8n.

**Severity:** CRITICAL

**Sources:**
- [Identity Resolution: 6-Step Process](https://www.heap.io/blog/identity-resolution-heres-a-6-step-process)
- Analysis of existing `contacts` table schema in `08-CAMPAIGN-TRACKING.md`
- The existing 399 "no email" contacts in the Alumni Reconnect campaign demonstrate this problem is already real

---

### Pitfall 3: N+1 Query Pattern in Dashboard Data Loading

**What goes wrong:** The current `getMarketingMetrics()` function makes 7 separate COUNT queries to Supabase. The `getLinkedInAutomationStatus()` makes 5 more. The `getMarketingAlerts()` calls `getMarketingMetrics()` again (duplicating those 7 queries) plus makes additional queries. A single page load triggers 15-20+ individual database round-trips. At 15-30ms latency per query, the page takes 300-600ms just for data fetching. As campaign_activity grows to 50K+ rows, COUNT queries with filters become expensive.

**Why it happens:**
- Supabase client API makes it easy to write one query per metric
- No pre-aggregated tables or materialized views for dashboard metrics
- The `campaign_funnel` and `channel_performance` views compute aggregates on every read
- `getMarketingAlerts()` calls `getMarketingMetrics()` internally, doubling the query count
- Postgres is row-oriented and not optimized for analytical aggregation queries

**Consequences:**
- Dashboard page load time degrades linearly with data volume
- At 50K+ activity rows, page loads exceed 2-3 seconds
- At 200K+ rows (realistic after a few months of 1,500 daily emails across 60 mailboxes), page becomes unusably slow
- Server component revalidation every 5 minutes (current `revalidate = 300`) means every visitor in that window hits the database
- RLS policies (if enabled) compound the performance penalty on COUNT queries

**Prevention:**
- Create a `daily_metrics` materialized view or summary table that pre-aggregates counts per day per channel per campaign
- Refresh it via a scheduled n8n workflow (or pg_cron) every 15-30 minutes, aligned with the data sync cadence
- Replace individual COUNT queries with a single RPC function that returns all metrics in one round-trip
- Use `SECURITY DEFINER` functions for analytics queries to bypass RLS overhead on aggregate operations
- Combine `getMarketingMetrics()` and `getMarketingAlerts()` so metrics aren't fetched twice
- Consider: dashboard reads from pre-computed summary tables, raw `campaign_activity` is the append-only source of truth

**Detection (warning signs):**
- Dashboard load time exceeds 1 second
- Supabase dashboard shows `campaign_activity` queries in the "slowest queries" list
- `pg_stat_statements` shows the same COUNT query pattern repeated many times per minute

**Phase:** Address pre-aggregation in Phase 2 (sync workflows create summary tables) and Phase 3 (dashboard reads from summaries). The current N+1 pattern in `queries.ts` should be refactored during dashboard phase.

**Severity:** CRITICAL

**Sources:**
- [Can I use Supabase for analytics?](https://www.tinybird.co/blog/can-i-use-supabase-for-user-facing-analytics) (confirms Postgres row-oriented limitation)
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- Direct analysis of existing `queries.ts` at `dashboard/src/lib/supabase/queries.ts` -- 7 COUNT queries in `getMarketingMetrics()` alone

---

### Pitfall 4: Silent Sync Failures with No Reconciliation

**What goes wrong:** An n8n sync workflow fails at 2am (API timeout, rate limit, webhook dropped), and nobody knows until someone notices the dashboard numbers look stale three days later. Meanwhile, decisions are being made on incomplete data. SmartLead webhook delivery fails silently. HeyReach API returns a 429 and the workflow doesn't retry. A GHL contact update is lost.

**Why it happens:**
- n8n workflows fail silently by default unless you explicitly configure error handling
- Webhook delivery is inherently unreliable (SmartLead notes replies can be delayed up to 2 hours, especially with Outlook)
- Rate limits: SmartLead allows 60 req/60s, HeyReach allows 300 req/min, GHL allows 100 req/10s -- easy to hit during bulk syncs
- No "last successful sync" tracking means you can't detect gaps
- No reconciliation process to catch missed events between webhook pushes

**Consequences:**
- Dashboard shows stale data but appears current (no visual indicator of sync freshness)
- Missed webhook events mean contacts "jump" stages without intermediate events
- Campaign performance metrics drift from platform reality over time
- Trust in the dashboard erodes when users notice discrepancies

**Prevention:**
- **Sync health tracking table:** Create `sync_status` in Supabase with columns: `platform`, `sync_type`, `last_success_at`, `last_failure_at`, `records_synced`, `error_message`
- **Heartbeat monitoring:** n8n workflow updates `sync_status` on every successful run. Dashboard shows a "data freshness" indicator with last sync time per platform
- **Dual ingestion strategy:** Use webhooks for real-time events (replies, bounces) AND scheduled polling for reconciliation (every 15-30 min, fetch full campaign stats and compare)
- **Idempotent upserts:** Every sync uses `INSERT ... ON CONFLICT (external_id, event_type, event_timestamp) DO NOTHING` so replaying missed events is safe
- **n8n error workflows:** Configure error triggers on every sync workflow that log to `sync_errors` table and (optionally) send a notification
- **SmartLead-specific:** Use the webhook publish summary endpoint to check for failed deliveries and retroactively fetch missed events
- **Rate limit handling:** Add Wait nodes with exponential backoff (3 retries, 5s/15s/45s) before API calls in n8n workflows. Use the token-bucket approach already implemented in the SmartLead MCP server as a reference pattern

**Detection (warning signs):**
- Dashboard shows no new activity for a platform for more than 1 hour during business hours
- `sync_status.last_success_at` is more than 2x the expected sync interval
- SmartLead campaign statistics don't match the count of `campaign_activity` events in Supabase
- A contact has a `quarterly_registered` flag but no preceding engagement events

**Phase:** Phase 2 (sync workflows) must build in error handling, retry logic, and sync health tracking from day one. Phase 3 (dashboard) must display sync freshness.

**Severity:** CRITICAL

**Sources:**
- [n8n Error Handling Best Practices](https://n8n-tutorial.com/tutorials/n8n/error-handling-and-debugging/n8n-error-handling-best-practices/)
- [SmartLead Webhook Failures](https://helpcenter.smartlead.ai/en/articles/417-how-to-resolve-webhook-failures)
- [n8n + Supabase: Upserts, Rate Limits, Webhooks](https://rolandsoftwares.com/content/n8n-supabase-postgres-upserts-rate-limits-webhooks/)
- SmartLead rate limit: [API Rate Limits](https://api.smartlead.ai/reference/rate-limits) - 60 req/60s confirmed
- Existing SmartLead MCP server token-bucket implementation at `mcp-servers/smartlead/index.js`

---

## High Severity Pitfalls

Mistakes that cause significant rework, incorrect metrics, or operational blind spots.

---

### Pitfall 5: Polling-Only Sync Creates 15-30 Minute Blind Spots for Time-Sensitive Events

**What goes wrong:** A high-value Director replies positively to a SmartLead email at 10:05am. The next polling sync runs at 10:30am. The GHL branch assignment doesn't happen until 10:35am (after processing). The personal follow-up email from iaml.com doesn't go out until the next GHL automation cycle. By then it's 11am -- nearly an hour after the hot lead engaged. For Tier 1 Directors, this delay kills momentum.

**Why it happens:**
- Polling-based sync is simple and predictable but introduces inherent latency
- SmartLead supports webhooks for real-time events (EMAIL_REPLIED, EMAIL_BOUNCED, etc.)
- HeyReach supports 20+ webhook events
- But webhooks require endpoint infrastructure, security, and reliability handling
- The "15-30 min sync" requirement in the project spec is polling-oriented

**Consequences:**
- Hot leads cool down between engagement and follow-up
- Tier 1 Director replies (the highest-value conversion events) get the same delayed treatment as bulk stats
- Dashboard may show a "positive reply" badge but the GHL follow-up hasn't triggered yet
- Competitor response time advantage (many B2B buyers expect response within 5 minutes)

**Prevention:**
- **Hybrid approach:** Use webhooks for high-value, time-sensitive events (replies, bounces, registrations) and polling for bulk stats reconciliation
- **SmartLead webhooks:** Configure `EMAIL_REPLIED` and `EMAIL_BOUNCED` webhooks to hit n8n webhook endpoints directly. SmartLead supports per-campaign webhooks
- **HeyReach webhooks:** Configure connection_accepted and message_replied webhooks
- **Priority routing:** Reply webhook -> Gemini classification -> GHL branch assignment should be a single, fast n8n workflow (not batched)
- **Polling for reconciliation only:** The 15-30 min polling sync fills in stats and catches missed webhooks, but is not the primary ingestion path for engagement events

**Detection (warning signs):**
- Time between a reply in SmartLead and the corresponding GHL email exceeds 15 minutes
- Dashboard shows "positive reply" events clustered at sync boundaries (e.g., always at :00 or :30)
- Tier 1 Directors report receiving follow-ups "too late" or after they've already responded to a competitor

**Phase:** Phase 2 (sync workflows). Webhook endpoints should be built alongside polling workflows, not deferred as an optimization.

**Severity:** HIGH

**Sources:**
- [SmartLead Webhooks and Automation](https://www.smartlead.ai/powerful-apis-and-automation)
- [HeyReach + n8n LinkedIn Automation Guide](https://www.heyreach.io/blog/linkedin-automation-n8n)
- Project context: Tier 1 Directors are the highest-value target; response speed matters for conversion

---

### Pitfall 6: Tier Classification Drift Between Platforms

**What goes wrong:** A contact is classified as "Director" based on their LinkedIn title in HeyReach, but their SmartLead record has a different title (e.g., "VP of Training" which maps to "Executive" tier). The contact shows up under different tiers depending on which platform's data you're looking at. The global tier filter on the dashboard shows inconsistent numbers because the classification isn't unified.

**Why it happens:**
- Job title data comes from different sources with different formats: LinkedIn (scraped by HeyReach), company website (imported to SmartLead), manual entry (GHL)
- Gemini AI classification may produce different results for title variants ("Director of Learning" vs "Learning Director" vs "Dir. L&D")
- No single canonical tier assignment that all platforms reference
- Titles change over time (promotions, job changes) and different platforms update at different rates

**Consequences:**
- Tier-filtered dashboard metrics are unreliable (the same person counted in different tiers depending on data source)
- Channel performance by tier is misleading (SmartLead shows 50 Director replies but HeyReach shows 40 Director connections for the same people classified differently)
- Messaging strategy breaks if a Director receives Executive-tier messaging or vice versa
- Funnel conversion rates by tier are inaccurate

**Prevention:**
- Store canonical `tier` on the `contacts` table as the single source of truth. Add: `tier TEXT CHECK (tier IN ('director', 'executive', 'manager', 'unclassified'))`
- Classify tier once during initial contact import/enrichment and store it centrally, not per-platform
- Use a deterministic classification function (not AI for each sync) -- map job_title patterns to tiers using a lookup table or SQL function
- When title data conflicts across platforms, use a priority order: LinkedIn (most current) > manual entry > imported data
- Sync the Supabase `tier` value back to platform tags/lists so SmartLead and HeyReach segment filters align

**Detection (warning signs):**
- Tier filter total counts change depending on which view you're looking at
- Sum of Director + Executive + Manager contacts does not equal total contacts
- A contact appears in Director-tier SmartLead stats but Executive-tier HeyReach stats

**Phase:** Phase 1 (schema: add `tier` to contacts table) and Phase 2 (sync workflows: classify and set tier during ingestion).

**Severity:** HIGH

---

### Pitfall 7: Activity Event Storm from 60 Mailboxes

**What goes wrong:** With 60 mailboxes sending ~1,500 emails/day across multiple campaigns, the `campaign_activity` table receives 1,500 `sent` events + opens (30-50% = 500-750) + clicks + bounces daily. That's potentially 3,000-5,000 events per day. Over a 3-month campaign, that's 270K-450K rows. SmartLead's open tracking may fire multiple times per email (each open generates a new event), which can 3-5x the actual engagement count.

**Why it happens:**
- Email open tracking fires on every pixel load, not per-unique-open. A contact who opens an email 3 times generates 3 `opened` events
- Gmail image proxy pre-fetches images, generating false opens
- Link click tracking similarly fires per-click, not per-unique-click
- No deduplication or aggregation at the event level -- every webhook delivery creates a new `campaign_activity` row

**Consequences:**
- Open rate and click rate are artificially inflated (showing 3 opens for 1 actual engagement)
- `campaign_activity` table grows very fast, degrading query performance
- Activity feed becomes noisy (same contact's 5 opens drown out meaningful events like replies)
- Storage costs increase unnecessarily on Supabase

**Prevention:**
- **Unique engagement tracking:** Add `UNIQUE(campaign_contact_id, campaign_channel_id, activity_type)` for engagement events (opened, clicked) OR track `first_opened_at` / `open_count` on `campaign_contact_channels` instead of individual open events
- **Deduplication logic in n8n:** Before inserting an `opened` event, check if one already exists for that contact+channel in the last 24 hours. If so, increment a counter rather than creating a new row
- **Separate raw events from summary:** Keep raw events in an append-only `campaign_events_raw` table (for audit), but maintain deduplicated counts in `campaign_contact_channels` (for dashboarding)
- **Use SmartLead's unique open/click counts:** The SmartLead statistics endpoint provides `unique_opened` and `unique_clicked` counts -- use these during reconciliation polling instead of counting raw events
- **Partition or archive:** After a campaign completes, archive old `campaign_activity` rows to a separate table or use Postgres partitioning by date

**Detection (warning signs):**
- Open rate exceeds 60-70% (likely counting multiple opens per contact)
- `campaign_activity` table exceeds 100K rows within the first month
- Activity feed shows the same contact "opening" the same email 5+ times
- Query performance on `campaign_activity` degrades noticeably

**Phase:** Phase 1 (schema: decide raw vs. summary event strategy) and Phase 2 (sync workflows: implement deduplication).

**Severity:** HIGH

**Sources:**
- [SmartLead API: Fetch Campaign Lead Statistics](https://api.smartlead.ai/reference/lead-statistics) (provides unique counts)
- Industry pattern: email open pixel fires per-load, not per-unique-open

---

### Pitfall 8: Stale Materialized Views Showing Wrong "Current" State

**What goes wrong:** You build materialized views for dashboard performance (solving Pitfall 3), but then the views show data from the last refresh time, not the current state. A campaign status changes to "paused" but the dashboard still shows it as "active" for up to 30 minutes. A contact registered 5 minutes ago but the funnel count hasn't updated. Users see contradictory information between different parts of the dashboard (real-time widgets vs. materialized aggregates).

**Why it happens:**
- Materialized views are snapshots, not live data
- Refresh frequency is a tradeoff between freshness and database load
- Different parts of the dashboard may read from views refreshed at different times
- No visible indicator of when data was last refreshed

**Consequences:**
- Users lose trust when they see conflicting numbers
- Real-time decisions made on stale aggregates
- "Why doesn't the funnel total match the registration count I just saw?" becomes a recurring complaint

**Prevention:**
- **Hybrid read strategy:** Use materialized views for aggregate metrics (funnel counts, rates, channel comparisons) but direct table reads for current-state fields (campaign status, last activity)
- **Track refresh timestamps:** Store `last_refreshed_at` per view and display it on the dashboard: "Metrics as of 10:15 AM"
- **Refresh on sync completion:** Rather than refreshing views on a schedule, trigger refresh at the end of each n8n sync workflow run: `REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_metrics_summary`
- **Use `CONCURRENTLY`:** Always use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid locking reads during refresh (requires a unique index on the materialized view)
- **Critical metrics stay real-time:** Total registrations and campaign status should always read from the base table. Rates and trends can be from materialized views

**Detection (warning signs):**
- Dashboard shows a campaign as "active" after you've paused it
- Registration count doesn't update immediately after a known registration
- Users report numbers that "lag behind"

**Phase:** Phase 3 (dashboard implementation). Design the read strategy before building components.

**Severity:** HIGH

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or ongoing maintenance burden.

---

### Pitfall 9: Inconsistent UTC/Timezone Handling Across Platforms

**What goes wrong:** SmartLead reports event timestamps in UTC. HeyReach may report in the user's account timezone. GHL stores in the sub-account's timezone. Your n8n workflows store whatever timestamp the API returns without normalization. Dashboard displays events in the wrong order. "Daily" aggregations split at different boundaries for different platforms. A reply that happened at 11pm EST on Monday shows up in Tuesday's stats because it was stored as UTC.

**Prevention:**
- Normalize ALL timestamps to UTC in Supabase (`TIMESTAMPTZ` columns, which the existing schema already uses -- good)
- Convert to the user's display timezone only in the frontend
- In n8n sync workflows, explicitly parse and convert timestamps before upserting
- Verify each platform's timestamp format in their API documentation before building sync logic
- For daily aggregations, use `date_trunc('day', activity_at AT TIME ZONE 'America/New_York')` to get business-day boundaries

**Phase:** Phase 2 (sync workflows). One-time verification of each platform's timestamp format.

**Severity:** MODERATE

---

### Pitfall 10: Schema Over-Normalization Making Dashboard Queries Impossible via Supabase Client

**What goes wrong:** The existing campaign tracking schema is deeply normalized (campaigns -> channels -> contact_channels -> activity, with joins through campaign_contacts). To display a simple "channel scoreboard" requires joining 4-5 tables. The Supabase JavaScript client struggles with complex multi-table joins and nested filters. Developers end up writing 10-line query chains that are fragile and hard to debug.

**Why it happens:** The schema was designed for operational correctness (tracking individual contact journeys), not for analytical read patterns (aggregate dashboards).

**Prevention:**
- Create purpose-built **Postgres views** or **RPC functions** for each dashboard card. The dashboard should never join more than 2 tables directly
- The existing `campaign_funnel` and `channel_performance` views are a good start -- build more like these for every dashboard metric
- Use RPC functions (`supabase.rpc('get_channel_scoreboard', { campaign_id })`) for complex aggregations rather than client-side query building
- Keep the normalized schema for writes (sync workflows) but build a denormalized read layer for the dashboard
- Pattern: `n8n writes to normalized tables -> pg_cron/trigger refreshes summary views -> dashboard reads from views`

**Phase:** Phase 1 (schema: design summary views alongside the normalized tables, not after) and Phase 3 (dashboard: always read from views/RPCs).

**Severity:** MODERATE

**Sources:**
- [How I Fixed My App's Slow Queries Using Supabase RPC Functions](https://medium.com/@jigsz6391/how-i-fixed-my-apps-slow-queries-in-minutes-using-supabase-rpc-functions-243173b41084)
- Direct analysis of existing `queries.ts` -- already shows the N+1 pattern from trying to do analytics queries via Supabase client

---

### Pitfall 11: Webhook Endpoint Security Exposure

**What goes wrong:** You create n8n webhook endpoints for SmartLead, HeyReach, and GHL to push events to. Someone discovers the webhook URL (it's often in API logs, browser DevTools, or platform config screens). They start POSTing fake events: fake bounces to make campaigns look unhealthy, fake replies to trigger GHL branch assignments, or fake registrations to corrupt conversion data.

**Prevention:**
- **Header-based authentication:** Require a secret token in a custom header (e.g., `X-Webhook-Secret: <random-64-char-string>`) and validate it in the n8n webhook node's first step
- **SmartLead:** Supports custom headers on webhook configuration -- add a verification secret
- **IP whitelisting (if available):** Restrict webhook endpoints to known platform IP ranges
- **Payload validation:** Verify required fields exist and values are within expected ranges before processing
- **Rate limiting on webhook endpoints:** Reject if more than 100 events/minute arrive (abnormal for your campaign volume)
- **Audit logging:** Log all incoming webhook payloads to a `webhook_audit` table before processing, so you can detect injection attempts

**Phase:** Phase 2 (sync workflows). Security should be built into webhook endpoints from the start, not bolted on later.

**Severity:** MODERATE

**Sources:**
- [Building Reliable Job Queue Integrations with n8n](https://www.codesmith.in/post/n8n-job-queue-webhook-callbacks)
- SmartLead webhook failure documentation confirms webhooks are HTTP-based with no built-in signing

---

### Pitfall 12: GHL Deduplication Settings Conflicting with Sync Logic

**What goes wrong:** GHL has its own contact deduplication preferences that control whether new submissions create new contacts or merge with existing ones. If "Allow Duplicate Contact" is turned on (or configured differently than expected), your n8n sync that creates/updates GHL contacts based on SmartLead engagement may create duplicate GHL records. Conversely, if GHL aggressively merges, it may overwrite data you need (like branch assignment from a different campaign).

**Why it happens:** GHL's dedup logic only matches on primary email and primary phone -- not on custom fields, external IDs, or LinkedIn URLs. GHL can only merge 10 records per batch. Your sync logic and GHL's built-in logic may fight each other.

**Prevention:**
- Verify GHL sub-account "Contact Deduplication Preferences" setting before building sync workflows. Document the current configuration
- Always upsert to GHL using email as the match key (since that's what GHL dedup uses)
- When creating GHL contacts from HeyReach (LinkedIn-only), wait until you have an email before syncing to GHL
- Store the GHL contact ID in Supabase (`external_ids.ghl_contact_id`) after creation and use it for subsequent updates (bypass GHL's dedup entirely by updating by ID)
- Never rely on GHL's dedup for data integrity -- treat it as a safety net, not the primary mechanism

**Phase:** Phase 2 (sync workflows). Verify GHL settings before building the GHL sync workflow.

**Severity:** MODERATE

**Sources:**
- [GHL Contact Deduplication Preferences](https://help.gohighlevel.com/support/solutions/articles/48001181714-allow-duplicate-contacts-contact-deduplication-preferences-)
- [GHL Manage and Merge Duplicate Contacts](https://help.gohighlevel.com/support/solutions/articles/155000006647-contacts-manage-and-merge-duplicates)

---

### Pitfall 13: Assuming Platform API Data Is Immediately Consistent

**What goes wrong:** You poll SmartLead's statistics endpoint and get `{ opens: 150 }`. You also sync individual lead events and count 145 opens. The numbers don't match. You assume your sync is broken and spend hours debugging, but the reality is that SmartLead's aggregate stats and individual event data update at different speeds. Similar inconsistencies exist in HeyReach and GHL.

**Why it happens:**
- Platform APIs often have eventual consistency -- aggregate statistics may update on a different schedule than individual event APIs
- SmartLead specifically notes reply delivery can be delayed up to 2 hours for Outlook accounts
- Caching layers in platform APIs may serve slightly stale data
- Webhook events may arrive before the polling API reflects them

**Prevention:**
- Use one authoritative data path per metric type. For open/click counts, use either webhooks OR polling, not both (unless one is explicitly for reconciliation)
- Accept a 5-10% variance between platform-reported aggregates and your event-level counts. Flag discrepancies over 10% for investigation
- When reconciling, always prefer your own event-level data (from webhooks) over platform aggregate stats, since you control the deduplication
- Document expected data latency per platform: SmartLead (up to 2 hours for replies), HeyReach (generally real-time), GHL (near real-time)
- Add a `data_reconciliation` log that tracks deltas between platform stats and your computed stats per sync run

**Phase:** Phase 2 (sync workflows) and Phase 4 (testing/validation).

**Severity:** MODERATE

---

## Minor Pitfalls

Mistakes that cause annoyance, confusion, or small rework but are fixable.

---

### Pitfall 14: Building Charts Before Data Exists

**What goes wrong:** You build beautiful Tremor charts for trend analysis, funnel visualization, and channel comparisons -- then realize you have no historical data to populate them. The dashboard launches showing empty charts or single data points with no trends. It looks broken even though it's working correctly.

**Prevention:**
- Start with metric cards and tables (which work with current-state data) before adding trend charts
- Build the data aggregation pipeline first; add trend visualization after 2-4 weeks of data accumulates
- For launch, use sparklines or simple up/down indicators instead of full time-series charts
- Consider seeding with historical data from SmartLead/HeyReach campaign reports (manual import) to bootstrap the historical view

**Phase:** Phase 3 (dashboard). Build metric cards and tables first. Defer trend charts to Phase 4 or later.

**Severity:** MINOR

---

### Pitfall 15: Hardcoding Platform-Specific Field Mappings

**What goes wrong:** Your n8n sync workflow maps SmartLead's `lead.email` to `contacts.email`, HeyReach's `prospect.linkedinUrl` to `contacts.linkedin_url`, and GHL's `contact.email` to `contacts.email`. These mappings are scattered across multiple n8n nodes. When SmartLead changes their API response format (they've done this before), or you add a new platform, you need to find and update mappings across many workflows.

**Prevention:**
- Create a "field mapping" configuration table in Supabase: `platform_field_mappings` with columns `platform`, `source_field`, `target_table`, `target_field`
- Or centralize mappings in a shared n8n "Function" node at the top of each sync workflow, so the mapping is in one place per platform
- Use n8n sub-workflows for the "normalize contact" step so all sync workflows call the same normalization logic
- Document the expected API response schema for each platform version you're integrating with

**Phase:** Phase 2 (sync workflows). Use sub-workflows for normalization from the start.

**Severity:** MINOR

---

### Pitfall 16: Missing "No Data" and Error States in Dashboard UI

**What goes wrong:** The channel scoreboard shows `NaN%` for HeyReach conversion rate because no data has synced yet. A metric card shows `0.0%` open rate -- but is that because the rate is genuinely 0%, or because the sync hasn't run? The activity feed is empty but there's no indication whether that's "nothing happened" or "sync is broken."

**Prevention:**
- Design explicit "no data" states for every dashboard component (already partially done -- the campaigns list has an empty state)
- Distinguish between "zero" (data exists, value is 0) and "no data" (no data has been synced for this metric yet)
- Show sync status per platform: green dot for "synced within last 30 min", yellow for "stale", red for "sync failed"
- Use loading skeletons (already have `MarketingSkeleton`) but also handle the "loaded but empty" state
- Show "Last updated: X minutes ago" on the dashboard header

**Phase:** Phase 3 (dashboard). Design empty/error/stale states alongside the happy path.

**Severity:** MINOR

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Pitfall # |
|-------------|---------------|------------|-----------|
| Schema Design | Double-counting conversions across channels | Single source of truth for conversions at contact level | 1 |
| Schema Design | No identity resolution strategy | External ID mapping + matching hierarchy | 2 |
| Schema Design | No pre-aggregation for dashboards | Design summary views/tables alongside normalized tables | 3, 10 |
| Schema Design | Event storm from open tracking | Decide raw vs. summary event strategy upfront | 7 |
| Sync Workflows | Silent failures with no monitoring | Sync health tracking table + error workflows | 4 |
| Sync Workflows | Polling-only misses time-sensitive events | Hybrid webhook + polling approach | 5 |
| Sync Workflows | Tier classification inconsistency | Centralized tier assignment on contacts table | 6 |
| Sync Workflows | Webhook endpoint security | Header auth + payload validation from day one | 11 |
| Sync Workflows | GHL dedup conflicts | Verify GHL settings + use ID-based updates | 12 |
| Sync Workflows | Platform data consistency assumptions | Document latency per platform, accept variances | 13 |
| Dashboard Build | N+1 queries from Supabase client | Read from views/RPCs, not raw tables | 3 |
| Dashboard Build | Stale materialized views | Hybrid read strategy + refresh on sync | 8 |
| Dashboard Build | Empty charts with no historical data | Metric cards first, charts after data accumulates | 14 |
| Dashboard Build | Missing error/empty states | Design all states alongside happy path | 16 |
| Testing/Validation | Numbers don't match platform dashboards | Reconciliation logging + variance thresholds | 13 |

---

## Summary: Top 5 Actions to Prevent the Worst Outcomes

1. **Design the conversion deduplication model in the schema phase.** One contact = one registration = one attributed channel. Do not sum platform-reported conversions.

2. **Build sync health monitoring from the start.** Every n8n sync workflow must update a `sync_status` table on success/failure. The dashboard must show data freshness.

3. **Use pre-aggregated summary tables for dashboard reads.** Never run COUNT(*) across `campaign_activity` for dashboard rendering. Pre-compute in materialized views refreshed on sync.

4. **Implement identity resolution during ingestion.** Match contacts across platforms using email + LinkedIn URL as anchors. Store external IDs per platform. Classify tier once, centrally.

5. **Use webhooks for high-value events, polling for reconciliation.** Replies and registrations need sub-minute delivery to GHL. Bulk stats can use 15-30 min polling.

---

## Sources

- [SmartLead API Rate Limits](https://api.smartlead.ai/reference/rate-limits) - 60 req/60s per API key [HIGH confidence]
- [SmartLead Webhook Failures](https://helpcenter.smartlead.ai/en/articles/417-how-to-resolve-webhook-failures) [HIGH confidence]
- [GHL API Rate Limits](https://help.gohighlevel.com/support/solutions/articles/48001060529-highlevel-api) - 100 req/10s burst, 200K/day [HIGH confidence]
- [GHL Contact Deduplication](https://help.gohighlevel.com/support/solutions/articles/48001181714-allow-duplicate-contacts-contact-deduplication-preferences-) [HIGH confidence]
- [HeyReach API](https://documenter.getpostman.com/view/23808049/2sA2xb5F75) - 300 req/min [MEDIUM confidence]
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) [HIGH confidence]
- [Supabase for Analytics](https://www.tinybird.co/blog/can-i-use-supabase-for-user-facing-analytics) [MEDIUM confidence]
- [n8n Error Handling Best Practices](https://n8n-tutorial.com/tutorials/n8n/error-handling-and-debugging/n8n-error-handling-best-practices/) [HIGH confidence]
- [n8n + Supabase Upserts](https://rolandsoftwares.com/content/n8n-supabase-postgres-upserts-rate-limits-webhooks/) [MEDIUM confidence]
- [Cross-Channel Attribution Pitfalls](https://www.thesmallbusinessexpo.com/blog/challenges-of-marketing-attribution/) [MEDIUM confidence]
- [Identity Resolution Process](https://www.heap.io/blog/identity-resolution-heres-a-6-step-process) [MEDIUM confidence]
- Existing codebase analysis: `08-CAMPAIGN-TRACKING.md`, `queries.ts`, `smartlead/index.js` [HIGH confidence]
