# Board Meeting Layer

## Purpose

The Board Meeting is the **strategic synthesis layer** that pulls insights from all Directors and provides unified intelligence to the CEO. It enables you to:

1. Get a holistic view across all departments
2. Ask strategic questions and receive multi-perspective answers
3. Identify cross-departmental patterns and opportunities
4. Make informed decisions with full context

Think of it as having a conversation with your entire executive team at once.

---

## Entry Points

### 1. Dashboard Button: "Board Meeting" (Future)

*Note: The dashboard is planned for future implementation. Initially, Board Meeting functionality will be conversational-only via Claude Code.*

Click to receive a comprehensive cross-departmental briefing.

**What it does:**
- Queries each Director for current status
- Synthesizes into executive summary
- Highlights cross-departmental insights
- Surfaces recommendations and concerns

**When to use:**
- Weekly strategic review
- Before planning sessions
- When you want the "big picture"

### 2. Question-Driven (Current)

Ask a strategic question in Claude (web or Code), and relevant Directors are automatically consulted.

**Examples:**
- "How should we approach Q1?"
- "Do we have capacity for a major campaign next month?"
- "What's working and what's not across the business?"
- "Should we pause LinkedIn automation?"

**How it works:**
- Board Meeting layer interprets the question
- Identifies which Directors need to respond
- Gathers perspectives from each
- Synthesizes into unified response

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        CEO Question                              │
│              "How should we approach Q1?"                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Board Meeting Layer                           │
│                                                                  │
│  1. Parse question intent                                       │
│  2. Identify relevant Directors                                 │
│  3. Query each Director                                         │
│  4. Synthesize responses                                        │
│  5. Generate unified briefing                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Marketing     │ │    Digital      │ │ Lead Intelligence│
│   Director      │ │    Director     │ │    Director      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ "Q4 campaigns   │ │ "Site stable,   │ │ "Apollo credits │
│  performed      │ │  but mobile     │ │  reset Jan 1,   │
│  well, double   │ │  conversion     │ │  can support    │
│  down on email" │ │  needs work"    │ │  increased vol" │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Synthesized Briefing                          │
│                                                                  │
│  "For Q1, I recommend focusing on email marketing where we     │
│   saw strong Q4 performance. Lead Intelligence can support      │
│   increased volume when Apollo credits reset. However,          │
│   Digital flags mobile conversion as a concern—consider         │
│   addressing before major campaigns..."                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Question Routing

The Board Meeting layer intelligently determines which Directors to consult:

| Question Type | Directors Consulted | Example |
|--------------|---------------------|---------|
| General health | All | "How's the business doing?" |
| Campaign planning | Marketing, Lead Intelligence | "Should we launch a new campaign?" |
| Website/technical | Digital | "Is the website performing?" |
| Capacity questions | Lead Intelligence, Marketing | "Do we have capacity for X?" |
| Prioritization | All | "What should we focus on?" |
| Cross-functional | Relevant subset | "Why did conversions drop?" |

---

## Board Meeting Output Format

### Full Briefing (Dashboard Button)

```
┌─────────────────────────────────────────────────────────────────┐
│ BOARD MEETING                                                    │
│ Generated: [Date] [Time]                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ EXECUTIVE SUMMARY                                                │
│ ───────────────────────────────────────────────────────────────  │
│ Overall business health is strong at 91/100. Email marketing    │
│ continues to outperform with 34% open rates. Main concerns      │
│ are Apollo credits running low and mobile conversion declining. │
│                                                                  │
│ DEPARTMENT BRIEFINGS                                             │
│ ───────────────────────────────────────────────────────────────  │
│                                                                  │
│ 📊 MARKETING (87/100) 🟢                                        │
│ Email campaigns performing above target. LinkedIn automation    │
│ approaching safety limits. Past participant segment idle.       │
│ • Recommend: Launch re-engagement campaign                      │
│ • Concern: Bounce rate trending up                              │
│                                                                  │
│ 💻 DIGITAL (94/100) 🟢                                          │
│ All systems operational. Registration flows 100% passing.       │
│ Approaching Supabase limits. Mobile conversion declining.       │
│ • Recommend: Investigate mobile UX                              │
│ • Concern: Plan for Supabase upgrade                            │
│                                                                  │
│ 🎯 LEAD INTELLIGENCE (91/100) 🟢                                │
│ Capacity at 77% utilization. Apollo credits low but resetting   │
│ soon. Domain health strong across the board.                    │
│ • Recommend: Reduce LinkedIn scraping temporarily               │
│ • Opportunity: Activate 2 rested domains                        │
│                                                                  │
│ STRATEGIC RECOMMENDATIONS                                        │
│ ───────────────────────────────────────────────────────────────  │
│ 1. Launch past participant re-engagement (Marketing + Lead      │
│    Intelligence aligned on capacity)                            │
│ 2. Address mobile conversion drop before next major campaign    │
│ 3. Plan Supabase tier upgrade in next 30 days                   │
│                                                                  │
│ RISKS & CONCERNS                                                 │
│ ───────────────────────────────────────────────────────────────  │
│ • Apollo credits may limit sourcing if large campaign needed    │
│   before reset date                                             │
│ • Mobile conversion decline could impact campaign ROI           │
│                                                                  │
│ DECISIONS NEEDED                                                 │
│ ───────────────────────────────────────────────────────────────  │
│ □ Approve re-engagement campaign launch?                        │
│ □ Prioritize mobile UX investigation?                           │
│ □ Authorize Supabase upgrade?                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Question Response (Conversational)

```
You: "Do we have capacity for a 2,000 lead campaign next week?"

Board Meeting Response:

Let me check with the relevant Directors...

**Lead Intelligence Director:**
Current daily capacity is 2,400 emails across 12 active domains.
Queue depth is 1,850, leaving 550/day headroom. For 2,000 leads,
we'd need approximately 4 days to send (accounting for validation losses).

However, Apollo credits are at 1,200—sourcing 2,000 leads would
exhaust them before the reset. Could pull ~800 from Apollo and
supplement with LinkedIn, but we're at 80% of weekly LinkedIn limits.

**Marketing Director:**
We could absorb 2,000 leads if spread across 4-5 days. Current
campaigns complete by Wednesday, freeing up capacity. Would need
to know the target segment to plan the right sequence.

**Synthesis:**
Yes, but with constraints:
- Sending: Feasible over 4-5 days
- Sourcing: Would need split approach (Apollo + LinkedIn)
- Timing: Best to start Thursday after current campaigns clear

Recommendation: Reduce to 1,500 leads (Apollo only) or wait 12 days
for credit reset if 2,000 is firm requirement.

Want me to have Lead Intelligence prepare a formal recommendation?
```

---

## Cross-Departmental Insights

The Board Meeting layer identifies patterns that individual Directors might miss:

### Pattern Detection Examples

**Marketing + Digital:**
> "Email open rates dropped 15% last week. Digital shows site
> load time increased during the same period. Possible correlation—
> slow landing pages may be affecting engagement."

**Lead Intelligence + Marketing:**
> "Leads from Apollo have 35% higher conversion than LinkedIn leads.
> Consider shifting budget toward Apollo when credits reset."

**All Departments:**
> "Mobile metrics are weak across the board: conversion down (Digital),
> email opens on mobile down (Marketing), mobile visitors up but
> engagement down (Analytics). Suggests mobile experience needs attention."

---

## Implementation Notes

### Data Sources

The Board Meeting layer queries:

1. **Supabase tables:** metrics, alerts, activity_log
2. **Director context:** Current state summaries from each department
3. **Real-time status:** Health scores, active alerts

### Synthesis Prompt Structure

```markdown
You are the Board Meeting synthesis layer for Business OS.

Your role:
1. Synthesize information from multiple department Directors
2. Identify cross-departmental patterns and conflicts
3. Provide unified, actionable recommendations
4. Highlight risks and opportunities
5. Present information appropriate for CEO-level decision making

Current department statuses:
[Director summaries injected here]

Current alerts:
[Active alerts injected here]

User question/request:
[User input]

Respond with:
- Direct answer to the question
- Relevant context from each department
- Cross-departmental insights if applicable
- Clear recommendations
- Any decisions needed
```

---

## Follow-Up Capabilities

After a Board Meeting briefing, you can:

**Drill down:**
> "Tell me more about what Marketing is seeing with bounce rates"

**Request action:**
> "Have Lead Intelligence prepare that re-engagement recommendation"

**Get specifics:**
> "Show me the domain health details"

**Compare:**
> "How does this compare to last month?"

**Plan:**
> "If we fix the mobile issue, what's the expected impact?"

---

## Scheduled Briefings (Optional)

Configure automatic Board Meeting briefings:

| Schedule | Type | Contents |
|----------|------|----------|
| Daily (8 AM) | Quick pulse | Health scores, critical alerts only |
| Weekly (Monday) | Full briefing | Complete cross-departmental review |
| Monthly | Strategic review | Trends, patterns, strategic recommendations |

Delivered via:
- Dashboard notification
- Email summary
- Slack (if integrated)
