# Business OS Workflows

n8n workflows for the Business OS automation platform.

## Uptime Monitor

**File:** `uptime-monitor.json`
**n8n Workflow ID:** `QBS1n2E0IFDyhR7y`
**Status:** Active
**URL:** https://n8n.realtyamp.ai/workflow/QBS1n2E0IFDyhR7y

Monitors www.iaml.com every 5 minutes and sends alerts via Slack and SendGrid email if the site is down.

### Current Configuration

- **Target:** https://www.iaml.com
- **Frequency:** Every 5 minutes
- **Timeout:** 30 seconds
- **Slack Channel:** Configured via webhook
- **Email:** mike.jackson@iaml.com (via SendGrid)

### How It Works

```
Schedule (5 min) → HTTP GET iaml.com → Check Status → Alert if Down
                                          ↓
                               Site Up? → Log success (no action)
                                          ↓
                               Site Down? → Slack Alert + Email Alert
```

### Alert Format

**Slack:**
```
:rotating_light: ALERT: iaml.com is DOWN

Status Code: 503
Error: Service Unavailable
Checked At: 2026-01-13T10:30:00Z

Please investigate immediately.
```

### Storing in n8n-brain

After importing and testing, store this pattern for future reference:

```javascript
// Via n8n-brain MCP tool: store_pattern
{
  "name": "Uptime Monitor",
  "description": "Monitors a website every 5 minutes and sends Slack/email alerts if down",
  "workflow_json": <contents of uptime-monitor.json>,
  "tags": ["monitoring", "uptime", "alerts"],
  "services": ["slack", "email"],
  "node_types": ["scheduleTrigger", "httpRequest", "if", "set", "slack", "emailSend"],
  "trigger_type": "schedule",
  "notes": "First worker in Business OS Phase 1. Uses error output for HTTP failures."
}
```

---

## HeyReach Activity Receiver

**n8n Workflow ID:** `9bt5BdyoosqB8ChU`
**Status:** Active
**Trigger:** Webhook
**URL:** https://n8n.realtyamp.ai/workflow/9bt5BdyoosqB8ChU
**Documentation:** [README-heyreach-activity-receiver.md](README-heyreach-activity-receiver.md)

Receives LinkedIn activity webhooks from HeyReach, logs to campaign tracking, classifies replies with Gemini AI, and routes qualified leads to GHL.

### How It Works

```
HeyReach Webhook → Normalize URL → Check Duplicate → Lookup/Create Contact
                                                            ↓
                                              Get Campaign Context → Log Activity
                                                            ↓
                                              Is Reply? → Gemini AI Classification
                                                            ↓
                                              Assign GHL Branch → Push to GHL
```

### Services

- HeyReach (webhook source)
- Supabase (contact & activity storage)
- Gemini AI (reply classification)
- GHL (CRM routing)

---

## Faculty Scheduler - Cancellation Re-release

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Webhook (POST)
**URL:** `https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease`
**Documentation:** [README-faculty-scheduler-rerelease.md](README-faculty-scheduler-rerelease.md)

Instantly notifies all qualified instructors when a teaching spot opens up due to cancellation, giving them a chance to claim the newly available block.

### How It Works

```
Webhook (cancel event) → Get Program Details → Check Active Tier
                                                      ↓
                         Program Active? → Get Eligible Instructors
                                                      ↓
                         Loop → SendGrid Email → Log Notification
                                                      ↓
                         Return count notified
```

### Webhook Payload

```json
{
  "program_id": "uuid",
  "block_id": "uuid",
  "block_name": "Block 1",
  "cancelled_by": "admin"
}
```

### Services

- Supabase (program data, instructor lookup, notification logging)
- SendGrid (email delivery)
- Slack (error alerts)

---

## Faculty Scheduler - Dashboard Alerts

**n8n Workflow ID:** TBD (optional workflow)
**Status:** Recommended (not required)
**Trigger:** Schedule (every 15 minutes)
**Documentation:** [README-faculty-scheduler-alerts.md](README-faculty-scheduler-alerts.md)

Automatically checks for programs at risk and unresponsive VIP instructors, keeping dashboard alerts up-to-date.

### How It Works

```
Schedule (15 min) → Call refresh_alerts() → Log Results
                                                ↓
                            Creates tier_ending alerts (critical)
                            Creates vip_non_response alerts (warning)
                            Auto-resolves when conditions change
```

### Note

This workflow is **optional**. The dashboard queries already call `refresh_alerts()` on page load for on-demand refresh. The periodic workflow provides belt-and-suspenders coverage for time-based alerts.

### Services

- Supabase (RPC call to refresh_alerts function)
- Slack (error alerts)

---

## Alert-to-Task Processor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Webhook (POST)
**URL:** `https://n8n.realtyamp.ai/webhook/alert-to-task`
**Documentation:** [README-alert-to-task.md](README-alert-to-task.md)

Automatically converts system alerts into trackable tasks in the Action Center. Critical issues become high-priority tasks due immediately; warnings become tasks due this week.

### How It Works

```
Alert Webhook → Validate → Get Config → Record Occurrence
                                              ↓
                          Route by Severity → Check Duplicates
                                              ↓
                          AI Transform Title → Calculate Due Date
                                              ↓
                          Create Task → Return Response
```

### Key Features

- **AI-powered titles** - Transforms alert titles into actionable task titles
- **Smart deduplication** - Prevents duplicate tasks, escalates priority if needed
- **Business hours** - Critical alerts after 6pm due next business day 9am
- **Accumulation** - Info alerts create task after 3 occurrences in 24 hours

### Services

- Anthropic Claude (AI title transformation)
- Supabase (task creation, deduplication, configuration)
- Slack (error alerts)

---

## Recurring Rules Executor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Daily 7:00 AM CT)
**Documentation:** [README-task-rules-executor.md](README-task-rules-executor.md)

Executes daily/weekly/monthly task rules from the Action Center. Creates tasks on schedule for things like daily standup, weekly review, and monthly reports.

### How It Works

```
Schedule (7am CT) → Call Execute Rules API → Process Active Rules
                                                      ↓
                          For each rule → Check dedupe key → Create task
                                                      ↓
                          Errors? → Slack Alert
```

### Services

- Dashboard API (execute rules endpoint)
- Supabase (task storage)
- Slack (error alerts)

---

## Condition Rules Executor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Daily 7:05 AM CT)
**Documentation:** [README-task-rules-executor.md](README-task-rules-executor.md)

Creates tasks when database conditions are met. Runs SQL queries daily and creates tasks for matching rows (overdue invoices, stale leads, etc.).

### How It Works

```
Schedule (7:05am CT) → Call Execute Rules API → Process Active Rules
                                                      ↓
                          For each rule → Execute SQL query → Create task per row
                                                      ↓
                          Errors? → Slack Alert
```

### Services

- Dashboard API (execute rules endpoint)
- Supabase (task storage, condition queries)
- Slack (error alerts)

---

## Daily Digest Sender

**File:** `daily-digest-sender.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Hourly 6-9am CT Weekdays)
**Documentation:** [README-daily-digest.md](README-daily-digest.md)

Sends daily email summaries of critical, overdue, and due-today tasks to each user at their preferred time.

### How It Works

```
Schedule (hourly) --> Call Digest API --> Filter by User Time
                                                   |
                      No Eligible Users <--------- Has Eligible?
                                                   |
                      Generate Digest --> Send Email --> Log Results
                                                   |
                      Failures? --> Slack Alert
```

### Key Features

- **Timezone-aware delivery** - Emails sent at each user's preferred time in their timezone
- **Smart filtering** - Skips users with no urgent items (nothing critical/overdue/due-today)
- **Batch processing** - Rate-limited to avoid overwhelming email service

### Services

- Dashboard API (digest generation and sending)
- Resend (email delivery via API)
- Supabase (user preferences, task data via API)
- Slack (error alerts, success logging)

---

## Weekly AI Focus Generator

**File:** `weekly-ai-focus.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Sunday 7pm CT + Friday 5pm CT)
**Documentation:** [README-weekly-ai-focus.md](README-weekly-ai-focus.md)

AI-powered weekly planning and task suggestions with pattern detection. Runs Sunday evening for planning mode and Friday afternoon for recap mode.

### How It Works

```
Schedule (Sun/Fri) --> Determine Mode --> Call AI Analysis API
                                                   |
                       API Success? -------------- |
                            |                      |
                       Build Content --> Create Weekly Focus Task
                            |
                       Create AI Suggestions --> Slack Success
                            |
                       API Failed? --> Slack Error Alert
```

### Key Features

- **Dual schedule** - Sunday evening planning, Friday afternoon recap
- **Pattern detection** - Identifies procrastination, workload imbalance, velocity trends
- **AI suggestions** - Creates tasks with confidence scores (0-100)
- **Deduplication** - Week-based dedupe keys prevent duplicates
- **Encouraging tone** - AI acts as supportive coach, not harsh critic

### Services

- Dashboard API (AI analysis endpoint)
- Claude (AI analysis and suggestions)
- Supabase (task creation via Postgres)
- Slack (success logging and error alerts)

---

## LinkedIn Content Engine

### WF1: Daily RSS Monitor

**File:** `n8n-workflows/linkedin-engine/wf1-daily-rss-monitor.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Daily 6:00 AM CST / 12:00 UTC)
**Documentation:** [README-wf1-daily-rss-monitor.md](README-wf1-daily-rss-monitor.md)

Scans 7 HR/AI news sources daily, classifies articles with Claude Sonnet (keywords, topic category, sentiment), and stores signals in `linkedin_engine.research_signals` via Supabase REST API.

#### How It Works

```
Schedule (6 AM CST)
  |-- RSS: SHRM -> Tag: SHRM --------------|
  |-- RSS: HR Dive -> Tag: HR Dive --------|
  |-- RSS: EEOC -> Tag: EEOC -------------|
  |-- RSS: DOL -> Tag: DOL ---------------+-> Filter Last 48h -> Has Items? -> Split Batches
  |-- RSS: Littler -> Tag: Littler --------|       | (loop)
  |-- RSS: Jackson Lewis -> Tag: JL ------|   Wait 1s -> Claude Classify -> Parse -> Insert Signal
  '-- RSS: Fisher Phillips -> Tag: FP ----'       | (done)
                                              Log Workflow Run

Error Trigger -> Log Error to Supabase (canary)
```

#### Services

- Supabase REST (signal storage, run logging, error logging)
- Claude Sonnet (article classification)
- RSS feeds (7 HR/AI news sources)

### WF2: Weekly Deep Research

**File:** `n8n-workflows/linkedin-engine/wf2-weekly-deep-research.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Sunday 8:00 PM CST / Monday 2:00 AM UTC)
**Documentation:** [README-wf2-weekly-deep-research.md](README-wf2-weekly-deep-research.md)

Scrapes Reddit (7 subreddits) and LinkedIn (HR/AI keyword search) via Apify, classifies each signal with Claude Sonnet, de-duplicates against existing entries, and stores results in `linkedin_engine.research_signals`.

#### How It Works

```
Schedule (Sun 8 PM CST)
  |
  Log Workflow Start
  |-- Reddit: Apify sync scrape (7 subreddits) -> Filter 50+ upvotes ---|
  |-- LinkedIn: Apify sync scrape (keyword search) -> Normalize posts ---+-> Merge
                                                                              |
                                                         Split Batches -> Stash Signal
                                                              | (loop)
                                                   Dedup Check -> Is New? -> Claude Classify
                                                              |              -> Parse -> Insert
                                                              | (done)
                                                   Count Inserted -> Log Workflow Complete

Error Trigger -> Log Error to Supabase (canary)
```

#### Services

- Apify (Reddit + LinkedIn scraping via sync endpoint)
- Claude Sonnet (signal classification: keywords, topic_category, sentiment)
- Supabase REST (dedup check, signal storage, run logging, error logging)

### WF3: Topic Scoring Engine

**File:** `n8n-workflows/linkedin-engine/wf3-topic-scoring-engine.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Monday 5:00 AM CST / 11:00 UTC)
**Documentation:** [README-wf3-topic-scoring-engine.md](README-wf3-topic-scoring-engine.md)

Scores and ranks this week's research topics across 5 dimensions (engagement, freshness, content gap, positioning, format) using a two-pass Claude architecture. Clusters raw signals into 6-10 topics, scores each, and inserts ranked results into `linkedin_engine.topic_recommendations`.

#### How It Works

```
Schedule (Monday 5 AM CST)
  |
  Calc Week & Log Start
  |
  Fetch Unprocessed Signals -> Normalize -> Has Signals?
                                              |          \
                                            [yes]       [no] -> Log Empty Run
                                              |
                                   Prepare for Clustering
                                              |
                                   Claude Pass 1: Cluster Topics (6-10 clusters)
                                              |
                                   Parse Clustering Response
                                              |
                                   SplitInBatches (1 topic at a time)
                                              | (loop)
                                   Claude Pass 2: Score Topic (5 dimensions)
                                              |
                                   Parse Score & Calculate Total -> Insert Topic
                                              | (done)
                                   Mark Signals Processed -> Log Run Complete

Error Trigger -> Log Error (canary)
```

#### Services

- Claude Sonnet (topic clustering + 5-dimension scoring)
- Supabase REST (signal reads, topic inserts, run logging, signal processing)

### WF4: Content Generation Pipeline

**File:** `n8n-workflows/linkedin-engine/wf4-content-generation-pipeline.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Webhook (POST to `linkedin-content-generate`)
**Documentation:** [README-wf4-content-generation-pipeline.md](README-wf4-content-generation-pipeline.md)

Takes approved topics and generates complete LinkedIn post drafts with 3 hook variations (data, contrarian, observation), full post text following brand voice, and first comment text via Claude Sonnet. Assigns drafts to calendar slots and notifies via Slack.

#### How It Works

```
Webhook (POST topic_id)
  |
  Validate Input & Log Run Start
  |
  Fetch Approved Topic -> Prepare Signal Fetch
  |
  +-- Fetch Source Signals ---|
  +-- Fetch Top Hooks --------+-> Assemble Context Package
  '-- Find Calendar Slot -----|
  |
  Claude: Generate Content (3 hooks + full post + first comment)
  |
  Parse Response -> Insert Post Draft -> Assign Calendar Slot
  |
  Slack Notification -> Log Run Complete

Error Trigger -> Log Error -> Slack Error Alert
```

#### Services

- Claude Sonnet (content generation -- brand voice, pillar framing, AEO terms)
- Supabase REST (topic/signal/hook reads, post insert, calendar assignment, run logging)
- Slack (success/error notifications)

### WF5: Publishing & First Comment

**File:** `n8n-workflows/linkedin-engine/wf5-publishing-first-comment.json`
**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Tue-Fri 8:00 AM CST / 14:00 UTC)
**Documentation:** [README-wf5-publishing-first-comment.md](README-wf5-publishing-first-comment.md)

Publishes approved LinkedIn posts on schedule, posts a first comment 45 seconds later, logs results to Supabase, and sends Slack notifications to #linkedin-content.

#### How It Works

```
Schedule (Tue-Fri 8 AM CST)
  |
  Fetch Calendar Slot -> Has Approved Post? --NO--> Skip Silently
  |YES
  Set 'scheduled' -> LinkedIn: Publish Post --FAIL--> Retry -> Revert + Alert
  |
  Extract URN -> Update Post & Calendar -> Wait 45s -> Post Comment -> Slack Notify
  |
  Log Run Complete

Error Trigger -> Log Error (canary) -> Slack Alert
```

#### Services

- LinkedIn OAuth2 (post publishing + first comment via REST API)
- Supabase REST (calendar/post reads, status updates, run logging)
- Slack (success notifications + error alerts)
