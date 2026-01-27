# Common Pitfalls to Avoid

## Overview

This document captures common mistakes and issues to avoid when building web intelligence workflows. Learn from others' errors.

---

## API Integration Pitfalls

### 1. GA4 Data Availability Delay

**The Pitfall:** Querying GA4 for "yesterday's" data at 12:01 AM and getting incomplete results.

**Why It Happens:** GA4 data has a processing delay of 24-48 hours. Data for a given day isn't fully available until 1-2 days later.

**The Fix:**
- Query for data 2 days ago, not 1 day ago
- Or schedule collection for 6am+ to allow processing
- Document this in workflow notes

### 2. DataForSEO Credit Consumption

**The Pitfall:** Burning through API credits in the first week because of inefficient queries.

**Why It Happens:** Each SERP check consumes credits. Checking 500 keywords daily adds up fast.

**The Fix:**
- Batch requests where possible
- Prioritize keywords by importance
- Check high-priority keywords daily, others weekly
- Cache results and avoid redundant calls

### 3. GSC Sampling at Scale

**The Pitfall:** Getting sampled (incomplete) data from GSC for large sites.

**Why It Happens:** GSC samples data when query returns >25,000 rows.

**The Fix:**
- Break queries into smaller date ranges
- Filter by specific dimensions
- Use the `rowLimit` parameter wisely
- Accept that some sampling is inevitable

### 4. Rate Limit Cascades

**The Pitfall:** Multiple workflows hitting the same API simultaneously and all failing.

**Why It Happens:** Scheduled at the same time, no coordination between workflows.

**The Fix:**
- Stagger workflow schedules (see Architecture doc)
- Implement request queuing
- Use n8n's built-in rate limiting
- Add jitter to scheduled times

---

## Database Pitfalls

### 5. Time-Series Table Bloat

**The Pitfall:** `daily_rankings` table grows to millions of rows and queries slow to a crawl.

**Why It Happens:** 500 keywords × 365 days = 182,500 rows/year, multiplied by competitor data.

**The Fix:**
- Implement table partitioning by month
- Create proper indexes on date columns
- Archive old data (see SYS-04)
- Use materialized views for common aggregations

### 6. Missing Indexes

**The Pitfall:** Simple queries taking 30+ seconds because of missing indexes.

**Why It Happens:** Tables created without thinking about query patterns.

**The Fix:**
- Index all columns used in WHERE clauses
- Index all columns used in JOINs
- Index date columns for time-series data
- Monitor slow queries with `pg_stat_statements`

### 7. NULL Handling in Aggregations

**The Pitfall:** AVG(position) returns wrong value when position is NULL for non-ranking keywords.

**Why It Happens:** NULL handling in SQL aggregations is tricky.

**The Fix:**
- Decide: Is NULL = "not ranking" or "unknown"?
- Use `COALESCE(position, 101)` for "not ranking"
- Or filter out NULLs explicitly: `WHERE position IS NOT NULL`
- Document the choice

---

## Anomaly Detection Pitfalls

### 8. Alert Fatigue

**The Pitfall:** So many alerts that they all get ignored.

**Why It Happens:** Thresholds too sensitive, every minor fluctuation triggers alert.

**The Fix:**
- Start with conservative thresholds (higher than you think)
- Tune based on feedback over time
- Implement alert batching/throttling
- Add severity levels and filter low-severity

### 9. Weekend/Holiday False Positives

**The Pitfall:** Every Saturday triggers a "traffic drop" alert.

**Why It Happens:** Comparing Saturday to Friday, not Saturday to last Saturday.

**The Fix:**
- Compare same day of week (7-day comparison)
- Build in holiday calendar awareness
- Use rolling 7-day averages as baseline
- Exclude weekends from business-metric alerts

### 10. New Page False Negatives

**The Pitfall:** New page published 3 days ago isn't flagged as underperforming, but it actually is.

**Why It Happens:** Not enough historical data to compare against.

**The Fix:**
- Separate logic for new pages (<30 days)
- Compare new pages to similar existing pages
- Set expectations for new page performance
- Flag pages that don't meet 7-day benchmarks

---

## Workflow Design Pitfalls

### 11. Monolithic Workflows

**The Pitfall:** One massive workflow that does collection, detection, and alerting. When one part fails, everything fails.

**Why It Happens:** Seems simpler to keep everything together.

**The Fix:**
- Split into Collect → Detect → Alert pattern
- Use webhooks to chain workflows
- Each workflow does one thing well
- Easier to debug and maintain

### 12. Missing Error Handlers

**The Pitfall:** Workflow fails silently. Nobody knows until data is missing for days.

**Why It Happens:** Forgot to add error handling, assumed it would just work.

**The Fix:**
- EVERY workflow gets try/catch
- EVERY failure sends Slack alert
- EVERY failure logs to n8n-brain
- Test error paths explicitly

### 13. Hardcoded Credentials

**The Pitfall:** API key embedded in workflow, then workflow exported/shared.

**Why It Happens:** Quick testing turned into production deployment.

**The Fix:**
- ALWAYS use n8n credentials
- Register credentials in n8n-brain
- Never put secrets in workflow JSON
- Audit workflows before sharing

### 14. No Idempotency

**The Pitfall:** Workflow runs twice, data is duplicated or corrupted.

**Why It Happens:** Didn't design for retries or manual re-runs.

**The Fix:**
- Use UPSERT instead of INSERT
- Include unique constraints on data tables
- Make workflows safe to run multiple times
- Clear before insert for "latest" snapshots

---

## AI/Claude Pitfalls

### 15. Token Explosion

**The Pitfall:** Sending entire database dump to Claude for analysis, hitting token limits.

**Why It Happens:** "More data = better insights" thinking.

**The Fix:**
- Pre-aggregate and summarize data
- Send only relevant subset
- Set max_tokens appropriately
- Chunk large analyses

### 16. Prompt Injection Vulnerability

**The Pitfall:** User-controllable data (page titles, keywords) included in prompt, manipulates Claude.

**Why It Happens:** Concatenating data directly into prompts.

**The Fix:**
- Sanitize user data before including
- Use structured data formats (JSON)
- Clearly delimit data vs. instructions
- Review prompts for injection risks

### 17. Non-Deterministic Reports

**The Pitfall:** Same data produces wildly different reports each time.

**Why It Happens:** Claude has inherent variability, no constraints on output.

**The Fix:**
- Set temperature=0 for consistency
- Use structured output format
- Provide specific output templates
- Validate outputs meet requirements

---

## Operational Pitfalls

### 18. No Backfill Strategy

**The Pitfall:** Workflow was broken for a week. How do you fill in the missing data?

**Why It Happens:** Didn't plan for failures during design.

**The Fix:**
- Design workflows to accept date parameter
- Create manual backfill mode
- Document backfill procedures
- Store raw API responses for replay

### 19. Credential Rotation Breaking Everything

**The Pitfall:** Rotated API key, all workflows failed simultaneously.

**Why It Happens:** Didn't coordinate rotation with workflow updates.

**The Fix:**
- Use credential abstraction (n8n-brain)
- Rotate one credential at a time
- Test after each rotation
- Set up credential expiration alerts (SYS-05)

### 20. Timezone Confusion

**The Pitfall:** "Yesterday" means different things to different systems.

**Why It Happens:** GA4 uses property timezone, GSC uses UTC, n8n uses server time.

**The Fix:**
- Standardize on one timezone (CT) for all Business OS
- Convert all timestamps on ingestion
- Document timezone assumptions
- Test around DST changes

---

## Data Quality Pitfalls

### 21. Comparing Apples to Oranges

**The Pitfall:** Traffic "dropped 90%" because you compared website traffic to app traffic.

**Why It Happens:** Dimension filtering changed between queries.

**The Fix:**
- Lock down query dimensions
- Store dimension metadata with data
- Validate data sources match
- Alert on unexpected dimension changes

### 22. Bot Traffic Pollution

**The Pitfall:** Traffic "spiked 500%" because of bot activity.

**Why It Happens:** Didn't filter bot traffic in GA4 view.

**The Fix:**
- Enable bot filtering in GA4
- Monitor for bot traffic patterns
- Exclude known bot IPs/UAs
- Have sanity checks on traffic ranges

### 23. Ranking Position 0

**The Pitfall:** "Position 0" in data - is that #1 or not ranking?

**Why It Happens:** Different APIs use different conventions.

**The Fix:**
- Standardize: Position 1 = #1 ranking
- Convert on ingestion (add 1 if 0-indexed)
- Document convention explicitly
- Validate no positions < 1 in database

---

## Testing Pitfalls

### 24. Testing in Production Only

**The Pitfall:** "It worked in dev" → breaks in production with real data volumes.

**Why It Happens:** No staging environment, no realistic test data.

**The Fix:**
- Create test data subset in Supabase
- Test with production-like volumes
- Use n8n's test execution feature
- Register test results in n8n-brain

### 25. Not Testing Error Paths

**The Pitfall:** Happy path works, first real error causes chaos.

**Why It Happens:** Only tested success scenarios.

**The Fix:**
- Deliberately trigger API errors
- Test with malformed data
- Verify error alerts actually send
- Test recovery/retry logic

---

## Checklist: Before Deploying Any Workflow

- [ ] Error handler added?
- [ ] Uses n8n credentials (not hardcoded)?
- [ ] Idempotent (safe to re-run)?
- [ ] Timezone handling correct?
- [ ] Rate limits respected?
- [ ] Slack alerts configured?
- [ ] n8n-brain registration added?
- [ ] Documentation written?

---
*Last updated: 2026-01-20*
*Add new pitfalls as they're discovered!*
