# LinkedIn Content Engine — Roadmap (v1.0)

> **CEO Summary:** 10-phase roadmap to build a fully automated LinkedIn content engine — from research collection through analytics feedback loops, with Phase 1 already complete.

## Milestone: v1.0

## Phase Overview

| Phase | Name | Status | Workflows | Dashboard Work | Requirements |
|-------|------|--------|-----------|----------------|--------------|
| 1 | Foundation | Done | — | Scaffold | FOUND-01..04 |
| 2 | Daily RSS Research | Built (awaiting import) | WF1 | — | RES-01, RES-02, RES-05, RES-06 |
| 3 | Weekly Deep Research | Built (awaiting import) | WF2 | — | RES-03, RES-04, RES-05, RES-06 |
| 4 | Topic Scoring & Selection | Done | WF3 | This Week (interactive) | SCORE-01..04 |
| 5 | Content Generation & Drafts | Done | WF4 | Drafts (interactive) | GEN-01..05 |
| 6 | Publishing | Planned | WF5 | Calendar updates | PUB-01..05 |
| 7 | Engagement Engine | Planned | WF6 | Engagement (enhanced) | ENG-01..04 |
| 8 | Post-Publish Monitor | Planned | WF7 | — | MON-01..03 |
| 9 | Analytics & Feedback Loop | Planned | WF8 | Analytics + Calendar | ANA-01..06 |
| 10 | Enrichment | Planned | Multiple | Carousel support | ENR-01..06 |

## Dependency Graph

```
Phase 1 ✅
  ├── Phase 2 (Daily RSS Research) ← BUILT (awaiting import)
  └── Phase 3 (Weekly Deep Research) ← BUILT (awaiting import)
        └── Phase 4 (Topic Scoring) ✅
              └── Phase 5 (Content Generation) ✅
                    └── Phase 6 (Publishing) ← depends on 5
                          ├── Phase 7 (Engagement) ← depends on 6
                          └── Phase 8 (Monitoring) ← depends on 6
                                └── Phase 9 (Analytics) ← depends on 8
                                      └── Phase 10 (Enrichment) ← depends on 9
```

---

## Phase 1: Foundation ✅

- **Status:** Complete
- **Goal:** Deploy database schema, scaffold dashboard, seed content calendar, integrate HR Agentic Pivot.
- **Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04

### Deliverables (Validated)
- [x] `linkedin_engine` schema with 10 tables + indexes
- [x] Dashboard page at `/dashboard/marketing/linkedin-content` (5 tabs scaffolded)
- [x] 4-week content calendar seeded with series/pillar rotation
- [x] Pivot columns (`pillar`) added to posts and content_calendar tables

### Key Files
- `supabase/migrations/20260208_create_linkedin_engine_schema.sql`
- `supabase/migrations/20260208001_seed_linkedin_calendar.sql`
- `supabase/migrations/20260213_linkedin_engine_pivot_updates.sql`
- `dashboard/src/app/dashboard/marketing/linkedin-content/`
- `dashboard/src/lib/api/linkedin-content-queries.ts`

---

## Phase 2: Daily RSS Research

- **Status:** In Progress
- **Goal:** Build n8n workflow that monitors HR/AI RSS feeds daily and stores signals in Supabase.
- **Dependencies:** Phase 1 ✅
- **Requirements:** RES-01, RES-02, RES-05, RES-06
- **Plans:** 1 plan

Plans:
- [ ] 02-01-PLAN.md — Build WF1 Daily RSS Monitor workflow + docs + n8n-brain registration

### Success Criteria
- [ ] WF1 (Daily RSS Monitor) built and active in n8n
- [ ] Runs daily at 6 AM CST
- [ ] Monitors SHRM, HR Dive, EEOC, DOL, employment law firm blogs via RSS
- [ ] Signals stored in `research_signals` with source, keywords, topic_category, sentiment
- [ ] `signal_week` correctly set to Monday of collection week
- [ ] Canary error handling pattern implemented
- [ ] Pattern registered in n8n-brain

### Technical Notes
- Use HTTP Request nodes + Supabase REST API (NOT native Postgres nodes)
- RSS sources: SHRM, HR Dive, EEOC press releases, DOL news, Littler, Jackson Lewis, Fisher Phillips blogs
- Use Claude Sonnet for keyword extraction and sentiment classification
- Credential: `Dy6aCSbL5Tup4TnE` (Supabase REST), `anthropic-api` (Claude)

---

## Phase 3: Weekly Deep Research

- **Status:** Planned
- **Goal:** Build n8n workflow that scrapes Reddit and LinkedIn weekly for trending HR/AI topics via Apify.
- **Dependencies:** Phase 1 ✅
- **Requirements:** RES-03, RES-04, RES-05, RES-06
- **Note:** Can run in parallel with Phase 2
- **Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md — Build WF2 Weekly Deep Research workflow (Reddit + LinkedIn via Apify) + docs + n8n-brain registration

### Success Criteria
- [ ] WF2 (Weekly Deep Research) built and active in n8n
- [ ] Runs Sunday 8 PM CST
- [ ] Scrapes 7 Reddit subreddits via Apify (r/humanresources, r/AskHR, r/antiwork, r/recruiting, r/employmentlaw, r/artificial, r/MachineLearning)
- [ ] Scrapes LinkedIn top posts in HR/AI space via Apify
- [ ] Signals de-duplicated against existing entries
- [ ] Platform engagement metrics stored in JSONB
- [ ] Pattern registered in n8n-brain

### Technical Notes
- Apify actors for Reddit and LinkedIn scraping
- Use Apify synchronous run endpoint (run-sync-get-dataset-items) for simplicity
- Budget: $57-79/mo Apify Starter plan
- Credential: Apify API token hardcoded in workflow

---

## Phase 4: Topic Scoring & Selection ✅

- **Status:** Complete
- **Goal:** Build scoring engine that ranks topics 0-100 across 5 dimensions and enables dashboard approval.
- **Dependencies:** Phase 2 + Phase 3
- **Requirements:** SCORE-01, SCORE-02, SCORE-03, SCORE-04
- **Plans:** 2 plans

Plans:
- [x] 04-01-PLAN.md — Build WF3 Topic Scoring Engine n8n workflow (two-pass Claude: cluster + score) + docs
- [x] 04-02-PLAN.md — Interactive dashboard "This Week" tab with score bars, approve/reject, API route

### Success Criteria
- [x] WF3 (Topic Scoring Engine) built (awaiting n8n import)
- [x] Runs Monday 5 AM CST (after weekend research completes)
- [x] Scores across 5 dimensions: engagement (0-25), freshness (0-25), gap (0-20), positioning (0-15), format (0-15)
- [x] AEO bonus (+3 points) applied when topic allows AEO terms
- [x] Ranked topics visible in dashboard "This Week" tab
- [x] Users can approve/reject topics (pick 3-4 per week)
- [x] Dashboard tab is interactive (not just display)

### Technical Notes
- Scoring algorithm detailed in PROMPT.md
- Claude Sonnet for gap analysis and positioning alignment assessment
- Dashboard: Add API route for topic status updates (approve/reject)

---

## Phase 5: Content Generation & Drafts ✅

- **Status:** Complete
- **Goal:** Build content generation pipeline that creates post drafts with hooks, and enable dashboard review/approval.
- **Dependencies:** Phase 4 ✅
- **Requirements:** GEN-01, GEN-02, GEN-03, GEN-04, GEN-05
- **Plans:** 2 plans

Plans:
- [x] 05-01-PLAN.md — Schema migration + TypeScript types + WF4 Content Generation Pipeline n8n workflow
- [x] 05-02-PLAN.md — Dashboard API routes + mutations + interactive Drafts tab UI + topic-approval webhook trigger

### Success Criteria
- [x] WF4 (Content Generation Pipeline) built and active in n8n
- [x] Triggered when topics are approved in dashboard
- [x] Generates 3 hook variations per topic (data, contrarian, observation)
- [x] Full post text follows brand voice (1,800-2,000 chars, no emojis, binary CTA)
- [x] First comment text generated for each post
- [x] Series and pillar assigned to each post
- [x] Dashboard "Drafts" tab allows hook selection (A/B/C), edit, approve, reject
- [x] Pillar-specific framing applied per PROMPT.md template

### Technical Notes
- Generation prompt template in PROMPT.md
- Claude Sonnet for content generation
- Context package includes: topic angle, research signals, top hooks from library, product roadmap phase
- Dashboard: Rich text editing, hook switcher, preview panel

---

## Phase 6: Publishing

- **Status:** Planned
- **Goal:** Build automated publishing workflow that posts approved content to LinkedIn and logs results.
- **Dependencies:** Phase 5
- **Requirements:** PUB-01, PUB-02, PUB-03, PUB-04, PUB-05

### Success Criteria
- [ ] WF5 (Publishing & First Comment) built and active in n8n
- [ ] Publishes approved posts Tue-Fri 8 AM CST via n8n LinkedIn OAuth2 node
- [ ] First comment posted 30-60 seconds after main post
- [ ] `linkedin_post_id` and `published_at` captured in Supabase
- [ ] Slack notification sent to #linkedin-content on publish
- [ ] Content calendar entry updated to `published` status
- [ ] LinkedIn OAuth2 credential configured in n8n

### Technical Notes
- n8n native LinkedIn node (OAuth2) — credential `linkedInOAuth2Api` needs setup
- Wait node for 30-60 second delay between post and first comment
- Slack webhook for notifications
- Do NOT edit posts within first hour (can reset LinkedIn distribution)

---

## Phase 7: Engagement Engine

- **Status:** Planned
- **Goal:** Build engagement workflow with daily comment digests and pre-post warming, plus dashboard tab.
- **Dependencies:** Phase 6
- **Requirements:** ENG-01, ENG-02, ENG-03, ENG-04

### Success Criteria
- [ ] WF6 (Engagement Engine) built and active in n8n
- [ ] Two modes: daily digest (7 AM) + pre-post warming (20 min before publish)
- [ ] Identifies 5-7 high-value posts to comment on daily
- [ ] Claude generates comment suggestions per post
- [ ] Pre-post warming alert sent to Slack and dashboard
- [ ] Dashboard "Engagement" tab shows comment activity, network, and ROI
- [ ] Engagement network management (add/edit/deactivate contacts)

### Technical Notes
- Two schedule triggers in one workflow (daily + pre-post)
- Engagement network contacts from `engagement_network` table
- Comment suggestions use Claude Sonnet with brand voice context
- ROI tracking: profile visits and connection requests per comment

---

## Phase 8: Post-Publish Monitor

- **Status:** Planned
- **Goal:** Build monitoring workflow that tracks comments and engagement velocity on published posts.
- **Dependencies:** Phase 6
- **Requirements:** MON-01, MON-02, MON-03
- **Note:** Can run in parallel with Phase 7

### Success Criteria
- [ ] WF7 (Post-Publish Monitor) built and active in n8n
- [ ] Polls for comments every 10 min for 2 hours after publish, then decreasing
- [ ] Comments classified by type (question, agreement, disagreement, addition, spam)
- [ ] Reply suggestions generated via Claude
- [ ] Engagement velocity tracked (reactions/comments per hour)
- [ ] `post_analytics` rows captured at increasing intervals

### Technical Notes
- Dynamic polling schedule: 10 min for 2 hrs → 30 min for 6 hrs → hourly for 24 hrs → daily for 7 days
- LinkedIn API polling for post comments and reactions
- Claude Sonnet for comment classification and reply generation

---

## Phase 9: Analytics & Feedback Loop

- **Status:** Planned
- **Goal:** Build analytics workflow that generates weekly reports and feeds insights back into scoring, plus dashboard tabs.
- **Dependencies:** Phase 8
- **Requirements:** ANA-01, ANA-02, ANA-03, ANA-04, ANA-05, ANA-06

### Success Criteria
- [ ] WF8 (Analytics Feedback Loop) built and active in n8n
- [ ] Runs Sunday 6 PM CST
- [ ] Weekly analytics report with all aggregate metrics
- [ ] Best/worst posts identified per week
- [ ] Insights fed back into topic scoring weights
- [ ] Hook library scores updated based on performance
- [ ] Dashboard "Analytics" tab with charts (impressions, engagement by format, hook comparison, time heatmap)
- [ ] Dashboard "Content Calendar" tab with visual calendar and status coloring

### Technical Notes
- Apify for LinkedIn analytics scraping (post performance data)
- Format performance, topic performance, hook performance stored as JSONB
- Recommendations array generated by Claude for next week's strategy
- Calendar color coding: open=gray, generated=blue, approved=green, published=purple

---

## Phase 10: Enrichment

- **Status:** Planned
- **Goal:** Add X/Twitter and Google Trends research, carousel generator, and optimization features.
- **Dependencies:** Phase 9
- **Requirements:** ENR-01, ENR-02, ENR-03, ENR-04, ENR-05, ENR-06

### Success Criteria
- [ ] X/Twitter monitoring integrated into research workflows
- [ ] Google Trends monitoring integrated into research workflows
- [ ] Carousel/PDF generator produces 5-8 slide documents
- [ ] Engagement network auto-discovery suggests new accounts
- [ ] A/B testing framework tracks hook variation performance with significance
- [ ] Posting time optimization recommends optimal times from historical data

### Technical Notes
- X/Twitter: Apify actor for Twitter scraping
- Google Trends: Apify actor or direct API
- Carousels: Generate PDF from post content, upload via LinkedIn document API
- A/B testing: Track per-hook-category engagement rates, chi-squared significance

---

## Phase Ordering Rationale

1. **Foundation first** (done) — schema and scaffold must exist before anything else
2. **Research before scoring** — scoring needs data to score
3. **Scoring before generation** — generation needs approved topics
4. **Generation before publishing** — publishing needs approved drafts
5. **Publishing before engagement** — engagement warming is pre/post publish
6. **Engagement before monitoring** — monitoring watches published posts
7. **Analytics last** — needs published posts with engagement data
8. **Enrichment last** — polish layer on top of working system
