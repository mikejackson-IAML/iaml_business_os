# Phase 8: Post-Publish Monitor - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build WF7 n8n workflow that monitors published LinkedIn posts — polls for new comments at dynamic intervals, classifies comment types, generates reply suggestions via Claude, and tracks engagement velocity. Includes a minimal comment view added to the existing Engagement dashboard tab. Analytics reporting and feedback loops are Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Reply suggestion style
- Tone: more conversational than post content, but NO emojis — still professional
- Reply generation prompt references brand voice documents (same PROMPT.md used by content generation)
- Original post text ALWAYS included in Claude context for reply generation (not just the comment)
- Length varies by comment type: short (1 sentence) for agreements, longer (2-3 sentences) for questions/disagreements
- 1 reply suggestion per comment — no multiple options

### Velocity alerts & thresholds
- Viral threshold: relative to rolling average engagement (2x average = viral)
- Bootstrap: calculate average from existing `post_analytics` rows after 5+ published posts; before that, use fixed fallback (20+ reactions in first hour)
- Viral alert triggers: Slack notification + engagement boost (trigger engagement warming on 3-5 network posts to ride momentum)
- No alerts for underperforming posts — data stored silently, Phase 9 surfaces it in weekly reports

### Comment triage behavior
- Classification types: question, agreement, disagreement, addition, spam
- Spam: flag in database, skip reply generation, no notification
- Priority types: questions + disagreements (both get Slack notification)
- Two-step disagreement strategy:
  1. First detection: reply suggestion is a follow-up question ("What's been your experience?" / "What would you suggest instead?")
  2. Subsequent poll detects their reply: now Claude has full thread context → reply suggestion shifts to acknowledge-and-bridge
- Monitor tracks conversation thread state for disagreements (disagreement → thread → resolved)

### Monitoring output
- All comment data and reply suggestions stored in Supabase
- Slack notifications ONLY for: (1) viral velocity threshold, (2) priority comments (questions + disagreements)
- Priority comment Slack messages: brief notification with post title + link to dashboard — reply suggestion NOT inline in Slack
- Minimal comment view added to existing Engagement dashboard tab: recent comments with classification and reply suggestion
- No separate dashboard page — extends existing Engagement tab

### Claude's Discretion
- Exact polling implementation approach in n8n (wait nodes, sub-workflows, etc.)
- Fixed fallback threshold value before 5 posts of data exist
- Comment classification prompt engineering
- How to detect reply threads (parent comment tracking)
- Dashboard comment view layout and positioning within Engagement tab

</decisions>

<specifics>
## Specific Ideas

- Brand voice documents (PROMPT.md) should inform reply generation — same voice guidelines used by WF4 content generation
- Disagreement handling inspired by good LinkedIn engagement practice: don't argue, ask questions first, then bridge when you understand their position
- Engagement boost on viral posts mirrors WF6 engagement warming pattern — comment on network posts to amplify momentum

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-post-publish-monitor*
*Context gathered: 2026-02-15*
