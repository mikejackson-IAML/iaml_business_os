# PhantomBuster Sales Navigator Scraper

> **CEO Summary:** Automatically scrapes LinkedIn Sales Navigator searches using PhantomBuster with built-in daily limits (1,500 profiles/day) and resume capability - if stopped mid-search, it picks up where it left off tomorrow.

**File:** `phantombuster-sales-nav-scraper.json`
**n8n Workflow ID:** `krhBQQ4QUUzIOjpy`
**Status:** Active
**URL:** https://n8n.realtyamp.ai/workflow/krhBQQ4QUUzIOjpy
**Trigger:** Daily Schedule (9am) + Webhook (add URLs)
**Webhook URL:** `https://n8n.realtyamp.ai/webhook/pb-queue-url`

## How It Works

```
Daily 9am Schedule OR Webhook → Check Daily Limit
                                      ↓
                     Limit OK? → Get Next Search (pending/paused)
                                      ↓
                     Mark In Progress → Launch PhantomBuster
                                      ↓
                     Poll Status (30s intervals, 10 min max)
                                      ↓
                     Fetch Results → Transform → Insert Profiles
                                      ↓
                     Process to Contacts → Check Daily Limit
                                      ↓
                     Limit Hit? → Pause (resume tomorrow)
                                 → Complete
```

## Key Features

### Resumable Progress
- **Paused searches resume first** - If daily limit is hit mid-search, it resumes tomorrow exactly where it left off
- **Offset tracking** - Tracks `current_offset` and `results_scraped` per search
- **Status flow:** `pending` → `in_progress` → `paused` (if limit hit) → `completed`

### Daily Limits
- **Default:** 1,500 profiles/day (configurable in `pb_daily_runs` table)
- **Batch size:** 250 profiles per PhantomBuster run
- **Conservative approach** - Stays well under LinkedIn's detection thresholds

### Data Flow
```
PhantomBuster Results → sales_nav_profiles (raw) → contacts (deduped)
```

## Database Schema

### pb_search_queue
Tracks search URLs and progress for resumable scraping.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `search_name` | text | Human-readable name |
| `search_url` | text | Sales Navigator search URL |
| `status` | text | pending/in_progress/completed/paused/failed |
| `total_results` | integer | Total available results |
| `results_scraped` | integer | How many scraped so far |
| `current_offset` | integer | Resume point |
| `pb_agent_id` | text | PhantomBuster agent ID |
| `created_at` | timestamptz | When queued |
| `last_run_at` | timestamptz | Last scrape attempt |

### pb_daily_runs
Tracks daily scraping totals against limits.

| Column | Type | Description |
|--------|------|-------------|
| `run_date` | date | Date (unique) |
| `profiles_scraped` | integer | Total scraped today |
| `daily_limit` | integer | Max allowed (default 1500) |
| `searches_processed` | integer | Completed searches today |

## RPC Functions

| Function | Purpose |
|----------|---------|
| `queue_pb_search(name, url, agent_id)` | Add URL to queue |
| `get_next_pb_search()` | Get next pending/paused search |
| `check_pb_daily_limit()` | Check if limit reached |
| `mark_pb_search_in_progress(id)` | Mark search as processing |
| `update_pb_search_progress(id, profiles, offset)` | Update progress after batch |
| `pause_pb_search(id)` | Pause search for resume |
| `insert_pb_profiles(search_id, profiles)` | Store profiles from PB |

## Webhook Usage

### Queue a Search URL

```bash
curl -X POST https://n8n.realtyamp.ai/webhook/pb-queue-url \
  -H "Content-Type: application/json" \
  -d '{
    "search_name": "VP Marketing - SaaS - US",
    "search_url": "https://www.linkedin.com/sales/search/people?query=...",
    "pb_agent_id": "optional-specific-agent-id"
  }'
```

### Response

```json
{
  "success": true,
  "search_id": "uuid-here",
  "message": "Search queued for processing"
}
```

## PhantomBuster Setup

### IAML Phantom Details

| Setting | Value |
|---------|-------|
| **Phantom Name** | IAML Sales Nav Scraper |
| **Phantom ID** | `261754944017446` |
| **Results per search URL** | 2500 |
| **Results per launch** | 1500 |
| **Launch mode** | Manual (triggered by n8n) |

### n8n Credentials

Create an HTTP Header Auth credential named "PhantomBuster API Key":
- **Header Name:** `X-Phantombuster-Key`
- **Header Value:** Your PhantomBuster API key

Then update the workflow nodes to use the correct credential ID.

### Phantom Configuration Checklist

- [x] Results per search URL: 2500
- [x] Results per launch: 1500
- [x] Remove duplicate profiles: Checked
- [x] Launch mode: Manual
- [x] Max execution time: 30 minutes
- [x] Max retries: 2
- [x] File management: Delete previous files

## Safe Limits (Option A)

| Metric | Value | Notes |
|--------|-------|-------|
| Daily limit | 1,500 | Conservative, well under detection |
| Profiles per run | 1,500 | Single daily run scrapes all |
| LinkedIn max | 2,500 | Per search result set |
| Schedule | 9am CT | Once daily, business hours |
| Polling timeout | 30 min | Max time to wait for PhantomBuster |

## Field Mapping

### PhantomBuster → sales_nav_profiles

| PhantomBuster | Our Schema |
|---------------|------------|
| `profileUrl` | `linkedin_url` |
| `linkedInId` | `linkedin_id` |
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `fullName` | `full_name` |
| `headline` | `headline` |
| `company` | `current_company` |
| `title` | `current_title` |
| `location` | `location` |
| `profilePicture` | `photo_url` |
| `isPremium` | `is_premium` |
| `isOpenToWork` | `is_open_to_work` |
| (full response) | `raw_data` |

### sales_nav_profiles → contacts

| Source | Destination |
|--------|-------------|
| `linkedin_url` | `linkedin_url` |
| `linkedin_id` | `linkedin_member_id` |
| `first_name` | `first_name` |
| `last_name` | `last_name` |
| `current_title` | `title` |
| `location` | `city` |
| `photo_url` | `profile_image_url` |
| — | `lead_source = 'sales_nav'` |
| — | `status = 'lead'` |
| (extras) | `enrichment_data` |

## Testing Checklist

- [ ] **Queue Test:** Add URL via webhook, verify appears in `pb_search_queue`
- [ ] **Limit Test:** Set `daily_limit` to 50, run, verify pauses correctly
- [ ] **Resume Test:** Run paused search next day, verify continues from offset
- [ ] **Storage Test:** Verify profiles appear in `sales_nav_profiles`
- [ ] **Contact Test:** Verify data moves to `contacts` table
- [ ] **Dedup Test:** Run same URL twice, verify no duplicate contacts

## Troubleshooting

### "Invalid Sales Navigator URL"
URL must contain `linkedin.com/sales`. Copy full URL from Sales Nav search.

### "Daily limit reached"
Wait until tomorrow or increase limit in `pb_daily_runs` table.

### "PhantomBuster agent timed out"
Agent took >10 minutes. Check PhantomBuster dashboard for issues.

### Profiles not appearing in contacts
Check `process_sales_nav_to_contacts()` was called. Look for errors in `sales_nav_profiles.raw_data`.

## Services

- **PhantomBuster** - Scraping engine
- **Supabase** - Database storage
- **n8n** - Workflow orchestration
