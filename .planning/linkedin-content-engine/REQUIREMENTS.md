# LinkedIn Content Engine — Requirements

> **CEO Summary:** 45 requirements across 10 categories defining what the LinkedIn Content Engine must do — from research collection through analytics feedback loops.

## Requirement Categories

| Category | Code | Count | Status |
|----------|------|-------|--------|
| Foundation | FOUND | 4 | All validated |
| Research | RES | 6 | Active |
| Scoring | SCORE | 4 | Active |
| Generation | GEN | 5 | Active |
| Publishing | PUB | 5 | Active |
| Engagement | ENG | 4 | Active |
| Monitoring | MON | 3 | Active |
| Analytics | ANA | 6 | Active |
| Enrichment | ENR | 6 | Active |
| **Total** | | **43** | |

---

## Foundation (Validated)

### FOUND-01: Database Schema
- **Status:** ✅ Validated
- **Description:** Create `linkedin_engine` schema in Supabase with 10 tables (research_signals, topic_recommendations, posts, post_analytics, hooks, engagement_network, comment_activity, content_calendar, weekly_analytics, workflow_runs) and indexes.
- **Migration:** `supabase/migrations/20260208_create_linkedin_engine_schema.sql`

### FOUND-02: Dashboard Scaffold
- **Status:** ✅ Validated
- **Description:** Scaffold dashboard page at `/dashboard/marketing/linkedin-content` with 5 tabs (This Week, Drafts, Content Calendar, Analytics, Engagement).
- **File:** `dashboard/src/app/dashboard/marketing/linkedin-content/`

### FOUND-03: Content Calendar Seed
- **Status:** ✅ Validated
- **Description:** Seed content calendar with 4 weeks of entries rotating series (Tue-Fri) and pillars.
- **Migration:** `supabase/migrations/20260208001_seed_linkedin_calendar.sql`

### FOUND-04: HR Agentic Pivot Integration
- **Status:** ✅ Validated
- **Description:** Add `pillar` column to posts and content_calendar tables. Default pillar assignments for existing calendar entries. New topic categories: `legacy_pivot`, `build_in_public`.
- **Migration:** `supabase/migrations/20260213_linkedin_engine_pivot_updates.sql`

---

## Research

### RES-01: Daily RSS Monitor
- **Description:** Daily workflow collects signals from SHRM, HR Dive, EEOC, DOL, and employment law firm blogs via RSS feeds. Runs at 6 AM CST.
- **Acceptance:** Signals stored in `research_signals` table with source, title, body_text, keywords, topic_category, and sentiment.

### RES-02: Research Signal Storage
- **Description:** All research signals stored with source URL, keywords, topic category, sentiment classification, and `signal_week` (Monday of the collection week).
- **Acceptance:** Each signal has a valid `signal_week`, `source`, and `topic_category`.

### RES-03: Weekly Reddit Research
- **Description:** Weekly workflow scrapes 7 Reddit subreddits via Apify for HR/AI discussions. Runs Sunday 8 PM CST.
- **Acceptance:** Reddit posts with 50+ upvotes captured. Platform engagement (upvotes, comments) stored in `platform_engagement` JSONB.

### RES-04: Weekly LinkedIn Research
- **Description:** Weekly workflow scrapes LinkedIn top posts in HR/AI space via Apify. Runs alongside Reddit research.
- **Acceptance:** Top LinkedIn posts captured with engagement metrics. De-duplicated against existing signals.

### RES-05: Topic Categorization
- **Description:** Research signals categorized by topic: `ai_compliance`, `ai_hiring`, `surveillance`, `employment_law`, `hr_tech`, `legacy_pivot`, `build_in_public`.
- **Acceptance:** Every signal has a valid `topic_category` from the defined set.

### RES-06: n8n-brain Pattern Registration
- **Description:** After building each workflow, register the pattern in n8n-brain for future reuse.
- **Acceptance:** `store_pattern` called with workflow name, description, and key configuration details.

---

## Scoring

### SCORE-01: Multi-Dimensional Topic Scoring
- **Status:** ✅ Complete
- **Description:** Topics scored 0-100 across 5 dimensions: engagement signal (0-25), freshness (0-25), content gap (0-20), positioning alignment (0-15), format potential (0-15).
- **Acceptance:** All 5 dimension scores stored individually in `topic_recommendations`. Total score is the sum.

### SCORE-02: AEO Bonus
- **Status:** ✅ Complete
- **Description:** +3 bonus points in positioning alignment score when a topic naturally allows use of AEO terms (Agentic RAG, Compliance Guardrails, Multi-Agent Orchestration, HR Agentic Systems).
- **Acceptance:** AEO bonus applied and reflected in `positioning_score`.

### SCORE-03: Ranked Topic Brief
- **Status:** ✅ Complete
- **Description:** Scored topics sent to dashboard as a ranked list with scores, angles, and recommended formats.
- **Acceptance:** Topics visible in dashboard "This Week" tab, sorted by `total_score` descending.

### SCORE-04: Topic Approve/Reject
- **Status:** ✅ Complete
- **Description:** Dashboard "This Week" tab allows approving or rejecting recommended topics for the week. Pick 3-4 topics.
- **Acceptance:** Status changes from `pending` to `approved` or `rejected`. `approved_at` timestamp set on approval.

---

## Generation

### GEN-01: Hook Variations
- **Description:** Content generation produces 3 hook variations per approved topic (data/statistic, contrarian, observation).
- **Acceptance:** 3 distinct hooks stored per post draft in `posts` table.

### GEN-02: Full Post Generation
- **Description:** Full post text generated following brand voice guidelines. Target 1,800-2,000 characters. Includes pillar framing and AEO terms where natural.
- **Acceptance:** `full_text` populated, follows formatting rules (hook + white space + short paragraphs + binary CTA + hashtags).

### GEN-03: First Comment Generation
- **Description:** First comment text generated for each post (link to resource, extended thought, or seeding question).
- **Acceptance:** `first_comment_text` populated for every draft.

### GEN-04: Series and Pillar Assignment
- **Description:** Posts include series assignment (not_being_told, compliance_radar, ask_ai_guy, flex) and pillar framing (legacy_future, building_in_public, partnered_authority).
- **Acceptance:** Both `series` and `pillar` fields populated on every post.

### GEN-05: Draft Review UI
- **Description:** Dashboard "Drafts" tab allows reviewing generated posts, selecting hook variation (A/B/C), approving, editing, or rejecting.
- **Acceptance:** Users can view full post text, switch between hooks, edit inline, and change status.

---

## Publishing

### PUB-01: Automated Publishing
- **Description:** Approved posts published via n8n LinkedIn OAuth2 node. Schedule: Tue-Fri 8 AM CST.
- **Acceptance:** Posts published to Mike's LinkedIn profile at scheduled time. `linkedin_post_id` captured.

### PUB-02: First Comment Posting
- **Description:** First comment posted 30-60 seconds after main post via LinkedIn API.
- **Acceptance:** Comment appears on the published post within 60 seconds.

### PUB-03: Publication Logging
- **Description:** Publication logged to Supabase with `linkedin_post_id` and `published_at` timestamp.
- **Acceptance:** Post status updated to `published`, `linkedin_post_id` and `published_at` fields populated.

### PUB-04: Slack Notification
- **Description:** Slack notification sent to #linkedin-content channel on successful publish.
- **Acceptance:** Slack message includes post title, hook used, and link to LinkedIn post.

### PUB-05: Calendar Status Update
- **Description:** Content calendar entry updated to `published` status after successful publish.
- **Acceptance:** Corresponding `content_calendar` row has `status = 'published'` and `post_id` linked.

---

## Engagement

### ENG-01: Daily Comment Digest
- **Description:** Daily workflow identifies 5-7 high-value posts to comment on from engagement network contacts.
- **Acceptance:** Digest sent to dashboard "Engagement" tab with post URLs, authors, and suggested comments.

### ENG-02: Pre-Post Warming
- **Description:** Alert sent 20 minutes before scheduled post publication to enable pre-post engagement activity.
- **Acceptance:** Slack notification and dashboard indicator 20 min before scheduled publish time.

### ENG-03: Comment Suggestions
- **Description:** Claude generates contextual comment suggestions for engagement network posts.
- **Acceptance:** Each digest item has 1-2 AI-generated comment suggestions.

### ENG-04: Engagement Dashboard
- **Description:** Dashboard "Engagement" tab shows comment activity, engagement network management, and comment ROI tracking.
- **Acceptance:** Tab displays recent comments, engagement network list (filterable by tier/category), and ROI metrics.

---

## Monitoring

### MON-01: Post-Publish Polling
- **Description:** After publishing, monitor polls for comments every 10 min for 2 hours, then decreasing frequency.
- **Acceptance:** New comments detected and stored within 10 minutes of posting for first 2 hours.

### MON-02: Comment Classification
- **Description:** Incoming comments classified by type (question, agreement, disagreement, addition, spam) with reply suggestions generated.
- **Acceptance:** Each comment has a `type` classification and at least one reply suggestion.

### MON-03: Engagement Velocity Tracking
- **Description:** Track engagement velocity (reactions/comments per hour) for each published post.
- **Acceptance:** `post_analytics` rows captured at increasing intervals showing engagement curve.

---

## Analytics

### ANA-01: Weekly Analytics Report
- **Description:** Weekly workflow generates analytics report: impressions, reactions, comments, shares, followers. Runs Sunday 6 PM CST.
- **Acceptance:** `weekly_analytics` row created with all aggregate metrics.

### ANA-02: Scoring Feedback Loop
- **Description:** Analytics insights fed back into topic scoring weights to improve future recommendations.
- **Acceptance:** Topic categories with higher historical engagement receive scoring boost.

### ANA-03: Hook Library Scoring
- **Description:** Hook library scores updated based on actual post performance data.
- **Acceptance:** `hooks.score` and `hooks.avg_engagement_rate` updated after each post's analytics captured.

### ANA-04: Analytics Dashboard
- **Description:** Dashboard "Analytics" tab shows post performance, trends, hook/format comparison, and best posting times.
- **Acceptance:** Charts for impressions over time, engagement by format, hook category comparison, and day/time heatmap.

### ANA-05: Visual Content Calendar
- **Description:** Dashboard "Content Calendar" tab shows visual calendar with status coloring (open=gray, generated=blue, approved=green, published=purple).
- **Acceptance:** Calendar view with color-coded entries, clickable to view post details.

### ANA-06: Performance Identification
- **Description:** Best and worst performing posts identified per week based on engagement rate.
- **Acceptance:** `best_post_id` and `worst_post_id` populated in `weekly_analytics`.

---

## Enrichment

### ENR-01: X/Twitter Research
- **Description:** Add X/Twitter monitoring to research workflows for HR/AI signals.
- **Acceptance:** X posts from HR influencers captured in `research_signals` with `source = 'twitter'`.

### ENR-02: Google Trends Research
- **Description:** Add Google Trends monitoring for HR/AI keyword trends.
- **Acceptance:** Trending keywords captured and factored into topic scoring freshness dimension.

### ENR-03: Carousel Generator
- **Description:** Build carousel/PDF generator for visual posts.
- **Acceptance:** 5-8 slide carousels generated from post content, uploaded as PDF to LinkedIn.

### ENR-04: Engagement Network Expansion
- **Description:** Expand engagement network database with automated discovery of new high-value accounts.
- **Acceptance:** System suggests new accounts to add based on comment interactions and industry relevance.

### ENR-05: Systematic A/B Testing
- **Description:** Implement systematic A/B testing of hook variations across posts.
- **Acceptance:** Hook performance tracked per category with statistical significance indicators.

### ENR-06: Posting Time Optimization
- **Description:** Optimize posting times based on actual engagement data rather than industry defaults.
- **Acceptance:** System recommends optimal posting times per day based on historical engagement curves.

---

## Traceability Matrix

| Requirement | Phase | Workflow | Dashboard Tab |
|-------------|-------|----------|---------------|
| FOUND-01..04 | 1 ✅ | — | Scaffold |
| RES-01, RES-02, RES-05, RES-06 | 2 | WF1: Daily RSS Monitor | — |
| RES-03, RES-04, RES-05, RES-06 | 3 | WF2: Weekly Deep Research | — |
| SCORE-01..03 | 4 | WF3: Topic Scoring Engine | This Week |
| SCORE-04 | 4 | — | This Week |
| GEN-01..04 | 5 | WF4: Content Generation | Drafts |
| GEN-05 | 5 | — | Drafts |
| PUB-01..05 | 6 | WF5: Publishing & First Comment | Content Calendar |
| ENG-01..04 | 7 | WF6: Engagement Engine | Engagement |
| MON-01..03 | 8 | WF7: Post-Publish Monitor | — |
| ANA-01..06 | 9 | WF8: Analytics Feedback Loop | Analytics, Content Calendar |
| ENR-01..06 | 10 | Multiple | Carousel support |
