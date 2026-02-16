# Phase 7: Engagement Engine - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build WF6 Engagement Engine n8n workflow with two modes (daily comment digest + pre-post warming) and an interactive dashboard Engagement tab with network management and ROI tracking. This phase covers finding posts to comment on, generating comment suggestions, warming before publishes, and tracking engagement ROI. Automated comment posting and reply management are NOT in scope.

</domain>

<decisions>
## Implementation Decisions

### Engagement Network & Targeting
- Tier criteria and network size are Claude's discretion (see below)
- Daily 5-7 post selection prioritizes **engagement potential** — pick posts with high existing engagement to maximize visibility of Mike's comments
- Post discovery approach is Claude's discretion (profile scraping vs feed scraping via Apify)

### Comment Generation Style
- **Mix of styles** per post — Claude picks the best approach: insight-adding for hot takes, question-asking for discussion posts, agreement+extension for peers
- **2 comment suggestions per post** — two different approaches so Mike can pick what fits his mood
- **Length varies by context** — short (1-2 sentences) for agreement/support, medium (2-4 sentences) for insights, longer for high-value opportunities
- **Subtle IAML mentions when natural** — reference experience/expertise when directly relevant ("We've seen this at IAML...") but never hard-sell in others' comment sections
- Comments must follow brand voice: technically curious, observer/builder tone, never prescriber

### Pre-Post Warming Routine
- **Full warming package** — includes 3-4 specific network posts to comment on + comment suggestions + context about what Mike's post is about (so comments can seed related conversations)
- **Delivered to Slack + dashboard** — Slack message to #linkedin-content channel AND visible indicator on Engagement dashboard tab
- **Warming targets are separate from daily digest** — chosen specifically for pre-post timing relevance, not pulled from the daily digest
- **Only on publish days (Tue-Fri)** — fires 20 min before the 8 AM CST publish. No warming alert on Mon/Sat/Sun

### Dashboard Engagement Tab
- **Primary view: Today's digest** — top of page shows today's 5-7 posts to comment on with suggestions. Network management and ROI below
- **Full CRUD for network management** — add new contacts, edit tiers/categories, deactivate contacts directly from dashboard
- **ROI tracking: automated via LinkedIn scraping** — Apify scrapes comment likes/replies after 24 hours. Profile visits/connection requests tracked where attributable
- **Full funnel ROI metrics** — likes on comments, replies received, profile views driven, connection requests driven

### Claude's Discretion
- Tier 1 vs Tier 2 criteria definition (follower count, relevance, or hybrid approach)
- Initial engagement network size (balance sustainable daily engagement with network breadth)
- Post discovery method (per-profile scraping vs feed-based via Apify — based on cost/reliability)
- Warming target selection algorithm (how to pick 3-4 posts that are topically relevant to the upcoming post)
- Dashboard sub-sections layout and data density
- ROI attribution methodology for profile views and connection requests

</decisions>

<specifics>
## Specific Ideas

- LinkedIn algorithm rule: first 60-90 minutes determine 70% of reach — pre-post warming and quick replies matter enormously
- Comments weighted 8x more than likes on LinkedIn — this is why engagement commenting is high-value
- Existing `engagement_network` table already has: linkedin_name, linkedin_url, linkedin_headline, follower_count, tier, category, engagement_history, last_monitored, last_engaged, avg_post_engagement, notes, active
- Existing `comment_activity` table already has: target_post_url, target_author, target_author_followers, comment_text, commented_at, likes_received, replies_received, profile_visits_driven, connection_requests_driven, roi_score
- Two schedule triggers in one workflow (daily digest at 7 AM + pre-post warming at 7:40 AM on publish days)
- Use Claude Sonnet for comment generation with brand voice context from PROMPT.md

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-engagement-engine*
*Context gathered: 2026-02-15*
